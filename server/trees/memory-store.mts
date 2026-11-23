import { randomUUID } from 'node:crypto';

import type { Day } from '#ks/lib/domain/boundaries/types.ts';
import type {
  AccountId,
  PersonId,
  PinId,
  PlaceId,
  RelationshipId,
  TreeId,
} from '#ks/lib/domain/ids/types.ts';
import type { Person } from '#ks/lib/domain/persons/types.ts';
import type { Pin, PinInput } from '#ks/lib/domain/pins/types.ts';
import type { Place, PlaceInput } from '#ks/lib/domain/places/types.ts';
import type {
  Relationship,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';
import type {
  SeedAccount,
  Tree,
  TreeScope,
  TreeStore,
} from '#ks/lib/domain/trees/types.ts';
import type { Validity } from '#ks/lib/domain/validity/types.ts';

import {
  parseAccountId,
  parsePersonId,
  parsePinId,
  parsePlaceId,
  parseRelationshipId,
  parseTreeId,
} from '#ks/lib/domain/ids/ids.mts';
import { MAX_LISTED } from '#ks/lib/domain/persons/schemas.mts';
import { MAX_PINS } from '#ks/lib/domain/pins/schemas.mts';
import { spanOf } from '#ks/lib/domain/pins/span.mts';
import { MAX_PLACES } from '#ks/lib/domain/places/schemas.mts';
import { endsOf } from '#ks/lib/domain/relationships/rules.mts';
import { MAX_RELATIONSHIPS } from '#ks/lib/domain/relationships/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';
import { isCurrentOn } from '#ks/lib/domain/validity/validity.mts';
import { savedOrNotFound } from '#ks/server/trees/saved.mts';

/** Code-point order: the byte order of UTF-8, as `collate "C"` gives in Postgres. */
const compare = (x: string, y: string): number =>
  Buffer.compare(Buffer.from(x), Buffer.from(y));

const identityOf = (issuer: string, subject: string) =>
  JSON.stringify([issuer, subject]);

/**
 * A TreeStore in memory, for tests and the test-only adapters. `seed` Accounts may have no Tree.
 * A seed Tree may hold People and Relationships, saved at version 1. The ten writes refuse a Tree
 * in `readOnly` as they refuse a Tree the Account may not access. The list reads of a Tree in
 * `failing` throw.
 */
export const memoryStore = (
  seed: SeedAccount[] = [],
  readOnly: TreeId[] = [],
  failing: TreeId[] = []
  // eslint-disable-next-line max-lines-per-function -- over 60 lines before the rule (C1174)
): TreeStore => {
  const accounts = new Map<string, AccountId>();
  const trees = new Map<TreeId, Tree>();
  const links = new Map<AccountId, Set<TreeId>>();
  const persons = new Map<TreeId, Map<PersonId, Person>>();
  const relationships = new Map<TreeId, Map<RelationshipId, Relationship>>();
  const places = new Map<TreeId, Map<PlaceId, Place>>();
  const pins = new Map<TreeId, Map<PinId, Pin>>();

  for (const { id, issuer, subject, trees: owned } of seed) {
    accounts.set(identityOf(issuer, subject), id);
    links.set(id, new Set(owned.map(tree => tree.id)));

    for (const tree of owned) {
      trees.set(tree.id, { id: tree.id, name: tree.name });
      persons.set(
        tree.id,
        new Map(
          (tree.persons ?? []).map(person => [
            person.id,
            { ...structuredClone(person), version: 1 },
          ])
        )
      );
      relationships.set(
        tree.id,
        new Map(
          (tree.relationships ?? []).map(relationship => [
            relationship.id,
            { ...structuredClone(relationship), version: 1 },
          ])
        )
      );
    }
  }

  const ownedBy = (accountId: AccountId) => [...(links.get(accountId) ?? [])];

  /** The Persons of a Tree the Account may access; undefined otherwise. */
  const personsOf = ({ accountId, treeId }: TreeScope) =>
    links.get(accountId)?.has(treeId) && trees.has(treeId)
      ? (persons.get(treeId) ?? persons.set(treeId, new Map()).get(treeId)!)
      : undefined;

  const frozen = ({ treeId }: TreeScope) => readOnly.includes(treeId);

  /**
   * The rows, or a throw for a Tree in `failing` that the Account may access. The message names no
   * Person.
   */
  const failIfListed = <Row,>(scope: TreeScope, rows: Row[]): Row[] => {
    if (failing.includes(scope.treeId) && personsOf(scope) !== undefined) {
      throw new Error('The fixture Tree failed to load.');
    }

    return rows;
  };

  /** The rows of a Tree in `table` if the Account may access the Tree; undefined otherwise. */
  const rowsOf = <Id, Row>(
    table: Map<TreeId, Map<Id, Row>>,
    scope: TreeScope
  ) =>
    personsOf(scope) === undefined
      ? undefined
      : (table.get(scope.treeId) ??
        table.set(scope.treeId, new Map()).get(scope.treeId)!);

  const relationshipsOf = (scope: TreeScope) => rowsOf(relationships, scope);

  const placesOf = (scope: TreeScope) => rowsOf(places, scope);

  const pinsOf = (scope: TreeScope) => rowsOf(pins, scope);

  /**
   * At most `MAX_PINS` copies of the Tree's Pins, ordered by id, each with its span from the Person
   * as saved now. A Tree in `failing` throws. The day query filters before it caps, as the SQL does.
   */
  const spanned = (
    scope: TreeScope,
    day?: Day
  ): { pin: Pin; span: Validity }[] =>
    structuredClone(failIfListed(scope, [...(pinsOf(scope)?.values() ?? [])]))
      .map(pin => ({
        pin,
        span: spanOf(pin.date, personsOf(scope)!.get(pin.personId)!),
      }))
      .filter(({ span }) => day === undefined || isCurrentOn(span, day))
      .sort((x, y) => compare(x.pin.id, y.pin.id))
      .slice(0, MAX_PINS);

  /** The id of the Relationship, if the ids are UUIDs and both Persons are in the Tree. */
  const joinable = (scope: TreeScope, input: RelationshipInput) => {
    const id = parseRelationshipId(input.id);
    const ends = endsOf(input).map(parsePersonId);
    const owned = personsOf(scope);

    return id !== undefined &&
      owned !== undefined &&
      ends.every(end => end !== undefined && owned.has(end))
      ? id
      : undefined;
  };

  /**
   * The Pin with its ids as UUIDs in lower case, as Postgres gives them, if its Person and Place are
   * in the Tree.
   */
  const pinnable = (
    scope: TreeScope,
    input: PinInput
  ): PinInput | undefined => {
    const id = parsePinId(input.id);
    const person = parsePersonId(input.personId);
    const place = parsePlaceId(input.placeId);

    return id !== undefined &&
      person !== undefined &&
      place !== undefined &&
      personsOf(scope)?.has(person) &&
      placesOf(scope)?.has(place)
      ? { ...input, id, personId: person, placeId: place }
      : undefined;
  };

  /**
   * Saves `input` at version 1 under `id` unless the id is saved, and gives a copy of the saved row.
   * Gives undefined for a frozen Tree, a Tree the Account may not access and an id that is not valid.
   */
  const added = <Id, Input extends { id: Id }>(
    scope: TreeScope,
    rows: Map<Id, { version: number } & Input> | undefined,
    id: Id | undefined,
    input: Input
  ) => {
    if (frozen(scope) || rows === undefined || id === undefined) {
      return undefined;
    }

    if (!rows.has(id)) {
      rows.set(id, { ...structuredClone(input), id, version: 1 });
    }

    return structuredClone(rows.get(id)!);
  };

  /**
   * Replaces the row at `id` and raises its version. `not-found` covers the cases of `added`, a
   * missing row and a row that fails `matches`. `conflict` is a stale `version`.
   */
  const updated = <Id, Input extends { id: Id }>(
    scope: TreeScope,
    rows: Map<Id, { version: number } & Input> | undefined,
    id: Id | undefined,
    input: Input,
    version: number,
    matches: (saved: Input) => boolean = () => true
  ) => {
    const saved = id === undefined ? undefined : rows?.get(id);

    if (
      frozen(scope) ||
      rows === undefined ||
      id === undefined ||
      saved === undefined ||
      !matches(saved)
    ) {
      return err('not-found');
    }

    if (saved.version !== version) {
      return err('conflict');
    }

    const next = { ...structuredClone(input), id, version: version + 1 };

    rows.set(id, next);

    return ok(structuredClone(next));
  };

  const addPin: TreeStore['addPin'] = async ({ pin, ...scope }) => {
    const pinned = pinnable(scope, pin);

    return savedOrNotFound(
      added(scope, pinsOf(scope), pinned?.id, pinned ?? pin)
    );
  };

  const updatePin: TreeStore['updatePin'] = async ({
    pin,
    version,
    ...scope
  }) => {
    const pinned = pinnable(scope, pin);

    return updated(scope, pinsOf(scope), pinned?.id, pinned ?? pin, version);
  };

  const addPlace: TreeStore['addPlace'] = async ({ place, ...scope }) =>
    savedOrNotFound(
      added(scope, placesOf(scope), parsePlaceId(place.id), place)
    );

  /**
   * Saves `place`, then runs `write`. If `write` fails, the Place goes, unless it was saved before
   * the call.
   */
  const placedPin = async <Refusal extends 'conflict' | 'not-found'>(
    scope: TreeScope,
    place: PlaceInput,
    write: () => Promise<Result<Pin, Refusal>>
  ): Promise<Result<Pin, 'not-found' | Refusal>> => {
    const placeId = parsePlaceId(place.id);
    const existed =
      placeId !== undefined && placesOf(scope)?.has(placeId) === true;
    const placed = await addPlace({ ...scope, place });

    if (!placed.ok) {
      return placed;
    }

    const saved = await write();

    if (!saved.ok && !existed) {
      placesOf(scope)?.delete(placeId as PlaceId);
    }

    return saved;
  };

  return {
    addAccount: async ({ issuer, subject, treeName }) => {
      const identity = identityOf(issuer, subject);

      if (accounts.has(identity)) {
        return err('exists');
      }

      // A random UUID is always well-formed.
      const accountId = parseAccountId(randomUUID())!;
      const treeId = parseTreeId(randomUUID())!;

      accounts.set(identity, accountId);
      trees.set(treeId, { id: treeId, name: treeName });
      links.set(accountId, new Set([treeId]));

      return ok({ accountId, treeId });
    },
    // `findPerson` and `updatePerson` look up the id as sent, so a Person keeps that id.
    addPerson: async ({ person, ...scope }) =>
      added(
        scope,
        personsOf(scope),
        parsePersonId(person.id) === undefined ? undefined : person.id,
        person
      ),
    addPin,
    addPinAt: async ({ pin, place, ...scope }) =>
      placedPin(scope, place, () =>
        addPin({ ...scope, pin: { ...pin, placeId: place.id } })
      ),
    addPlace,
    addRelationship: async ({ relationship, ...scope }) =>
      savedOrNotFound(
        added(
          scope,
          relationshipsOf(scope),
          joinable(scope, relationship),
          relationship
        )
      ),
    findAccount: async (issuer, subject) => {
      const id = accounts.get(identityOf(issuer, subject));

      return id === undefined ? undefined : { id };
    },
    findPerson: async ({ personId, ...scope }) =>
      structuredClone(personsOf(scope)?.get(personId)),
    findPin: async ({ pinId, ...scope }) =>
      structuredClone(pinsOf(scope)?.get(parsePinId(pinId) as PinId)),
    findPlace: async ({ placeId, ...scope }) =>
      structuredClone(placesOf(scope)?.get(parsePlaceId(placeId) as PlaceId)),
    findRelationship: async ({ relationshipId, ...scope }) =>
      structuredClone(
        relationshipsOf(scope)?.get(
          parseRelationshipId(relationshipId) as RelationshipId
        )
      ),
    findTree: async ({ accountId, treeId }) => {
      const found = trees.get(treeId);

      return found !== undefined && links.get(accountId)?.has(treeId)
        ? { id: found.id, name: found.name }
        : undefined;
    },
    findTrees: async accountId =>
      ownedBy(accountId)
        .sort()
        .map(id => {
          const { name } = trees.get(id) as Tree;

          return { id, name };
        }),
    listPersons: async scope =>
      structuredClone(
        failIfListed(scope, [...(personsOf(scope)?.values() ?? [])])
      )
        .sort(
          (x, y) =>
            compare(x.surname, y.surname) ||
            compare(x.givenNames, y.givenNames) ||
            compare(x.id, y.id)
        )
        .slice(0, MAX_LISTED),
    listPins: async scope =>
      spanned(scope).map(({ pin, span }) => ({ ...pin, span })),
    listPinsOn: async ({ day, ...scope }) =>
      spanned(scope, day).map(({ pin }) => pin),
    listPlaces: async scope =>
      structuredClone(
        failIfListed(scope, [...(placesOf(scope)?.values() ?? [])])
      )
        .sort((x, y) => compare(x.id, y.id))
        .slice(0, MAX_PLACES),
    listRelationships: async scope =>
      structuredClone(
        failIfListed(scope, [...(relationshipsOf(scope)?.values() ?? [])])
      )
        .sort((x, y) => compare(x.id, y.id))
        .slice(0, MAX_RELATIONSHIPS),
    updatePerson: async ({ person, version, ...scope }) =>
      updated(scope, personsOf(scope), person.id, person, version),
    updatePin,
    updatePinAt: async ({ pin, place, version, ...scope }) =>
      placedPin(scope, place, () =>
        updatePin({
          ...scope,
          pin: { ...pin, placeId: place.id },
          version,
        })
      ),
    updatePlace: async ({ place, version, ...scope }) =>
      updated(scope, placesOf(scope), parsePlaceId(place.id), place, version),
    updateRelationship: async ({ relationship, version, ...scope }) =>
      updated(
        scope,
        relationshipsOf(scope),
        joinable(scope, relationship),
        relationship,
        version,
        saved =>
          saved.type === relationship.type &&
          endsOf(saved).join() === endsOf(relationship).join()
      ),
  };
};
