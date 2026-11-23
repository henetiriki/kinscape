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

/** The rows of the store, and the Trees whose writes or list reads the test changes. */
type Memory = {
  accounts: Map<string, AccountId>;
  failing: TreeId[];
  links: Map<AccountId, Set<TreeId>>;
  persons: Map<TreeId, Map<PersonId, Person>>;
  pins: Map<TreeId, Map<PinId, Pin>>;
  places: Map<TreeId, Map<PlaceId, Place>>;
  readOnly: TreeId[];
  relationships: Map<TreeId, Map<RelationshipId, Relationship>>;
  trees: Map<TreeId, Tree>;
};

/** Code-point order: the byte order of UTF-8, as `collate "C"` gives in Postgres. */
const compare = (x: string, y: string): number =>
  Buffer.compare(Buffer.from(x), Buffer.from(y));

const identityOf = (issuer: string, subject: string) =>
  JSON.stringify([issuer, subject]);

/** The rows of `seed`: its Accounts, their Trees, and the People and Relationships at version 1. */
const seeded = (
  seed: SeedAccount[],
  readOnly: TreeId[],
  failing: TreeId[]
): Memory => {
  const memory: Memory = {
    accounts: new Map(),
    failing,
    links: new Map(),
    persons: new Map(),
    pins: new Map(),
    places: new Map(),
    readOnly,
    relationships: new Map(),
    trees: new Map(),
  };

  for (const { id, issuer, subject, trees: owned } of seed) {
    memory.accounts.set(identityOf(issuer, subject), id);
    memory.links.set(id, new Set(owned.map(tree => tree.id)));

    for (const tree of owned) {
      memory.trees.set(tree.id, { id: tree.id, name: tree.name });
      memory.persons.set(
        tree.id,
        new Map(
          (tree.persons ?? []).map(person => [
            person.id,
            { ...structuredClone(person), version: 1 },
          ])
        )
      );
      memory.relationships.set(
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

  return memory;
};

/** The Persons of a Tree the Account may access; undefined otherwise. */
const personsOf = (
  { links, persons, trees }: Memory,
  { accountId, treeId }: TreeScope
) =>
  links.get(accountId)?.has(treeId) && trees.has(treeId)
    ? (persons.get(treeId) ?? persons.set(treeId, new Map()).get(treeId)!)
    : undefined;

const frozen = ({ readOnly }: Memory, { treeId }: TreeScope) =>
  readOnly.includes(treeId);

/**
 * The rows, or a throw for a Tree in `failing` that the Account may access. The message names no
 * Person.
 */
const failIfListed = <Row,>(
  memory: Memory,
  scope: TreeScope,
  rows: Row[]
): Row[] => {
  if (
    memory.failing.includes(scope.treeId) &&
    personsOf(memory, scope) !== undefined
  ) {
    throw new Error('The fixture Tree failed to load.');
  }

  return rows;
};

/** The rows of a Tree in `table` if the Account may access the Tree; undefined otherwise. */
const rowsOf = <Id, Row>(
  memory: Memory,
  table: Map<TreeId, Map<Id, Row>>,
  scope: TreeScope
) =>
  personsOf(memory, scope) === undefined
    ? undefined
    : (table.get(scope.treeId) ??
      table.set(scope.treeId, new Map()).get(scope.treeId)!);

const relationshipsOf = (memory: Memory, scope: TreeScope) =>
  rowsOf(memory, memory.relationships, scope);

const placesOf = (memory: Memory, scope: TreeScope) =>
  rowsOf(memory, memory.places, scope);

const pinsOf = (memory: Memory, scope: TreeScope) =>
  rowsOf(memory, memory.pins, scope);

/**
 * At most `MAX_PINS` copies of the Tree's Pins, ordered by id, each with its span from the Person
 * as saved now. A Tree in `failing` throws. The day query filters before it caps, as the SQL does.
 */
const spanned = (
  memory: Memory,
  scope: TreeScope,
  day?: Day
): { pin: Pin; span: Validity }[] =>
  structuredClone(
    failIfListed(memory, scope, [...(pinsOf(memory, scope)?.values() ?? [])])
  )
    .map(pin => ({
      pin,
      span: spanOf(pin.date, personsOf(memory, scope)!.get(pin.personId)!),
    }))
    .filter(({ span }) => day === undefined || isCurrentOn(span, day))
    .sort((x, y) => compare(x.pin.id, y.pin.id))
    .slice(0, MAX_PINS);

/** The id of the Relationship, if the ids are UUIDs and both Persons are in the Tree. */
const joinable = (
  memory: Memory,
  scope: TreeScope,
  input: RelationshipInput
) => {
  const id = parseRelationshipId(input.id);
  const ends = endsOf(input).map(parsePersonId);
  const owned = personsOf(memory, scope);

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
  memory: Memory,
  scope: TreeScope,
  input: PinInput
): PinInput | undefined => {
  const id = parsePinId(input.id);
  const person = parsePersonId(input.personId);
  const place = parsePlaceId(input.placeId);

  return id !== undefined &&
    person !== undefined &&
    place !== undefined &&
    personsOf(memory, scope)?.has(person) &&
    placesOf(memory, scope)?.has(place)
    ? { ...input, id, personId: person, placeId: place }
    : undefined;
};

/**
 * Saves `input` at version 1 under `id` unless the id is saved, and gives a copy of the saved row.
 * Gives undefined for a frozen Tree, a Tree the Account may not access and an id that is not valid.
 */
const added = <Id, Input extends { id: Id }>(
  memory: Memory,
  scope: TreeScope,
  rows: Map<Id, { version: number } & Input> | undefined,
  id: Id | undefined,
  input: Input
) => {
  if (frozen(memory, scope) || rows === undefined || id === undefined) {
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
  memory: Memory,
  scope: TreeScope,
  rows: Map<Id, { version: number } & Input> | undefined,
  id: Id | undefined,
  input: Input,
  version: number,
  matches: (saved: Input) => boolean = () => true
) => {
  const saved = id === undefined ? undefined : rows?.get(id);

  if (
    frozen(memory, scope) ||
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

const accountMethods = (
  memory: Memory
): Pick<
  TreeStore,
  'addAccount' | 'findAccount' | 'findTree' | 'findTrees'
> => ({
  addAccount: async ({ issuer, subject, treeName }) => {
    const identity = identityOf(issuer, subject);

    if (memory.accounts.has(identity)) {
      return err('exists');
    }

    // A random UUID is always well-formed.
    const accountId = parseAccountId(randomUUID())!;
    const treeId = parseTreeId(randomUUID())!;

    memory.accounts.set(identity, accountId);
    memory.trees.set(treeId, { id: treeId, name: treeName });
    memory.links.set(accountId, new Set([treeId]));

    return ok({ accountId, treeId });
  },
  findAccount: async (issuer, subject) => {
    const id = memory.accounts.get(identityOf(issuer, subject));

    return id === undefined ? undefined : { id };
  },
  findTree: async ({ accountId, treeId }) => {
    const found = memory.trees.get(treeId);

    return found !== undefined && memory.links.get(accountId)?.has(treeId)
      ? { id: found.id, name: found.name }
      : undefined;
  },
  findTrees: async accountId =>
    [...(memory.links.get(accountId) ?? [])].sort().map(id => {
      const { name } = memory.trees.get(id) as Tree;

      return { id, name };
    }),
});

const personMethods = (
  memory: Memory
): Pick<
  TreeStore,
  'addPerson' | 'findPerson' | 'listPersons' | 'updatePerson'
> => ({
  // `findPerson` and `updatePerson` look up the id as sent, so a Person keeps that id.
  addPerson: async ({ person, ...scope }) =>
    added(
      memory,
      scope,
      personsOf(memory, scope),
      parsePersonId(person.id) === undefined ? undefined : person.id,
      person
    ),
  findPerson: async ({ personId, ...scope }) =>
    structuredClone(personsOf(memory, scope)?.get(personId)),
  listPersons: async scope =>
    structuredClone(
      failIfListed(memory, scope, [
        ...(personsOf(memory, scope)?.values() ?? []),
      ])
    )
      .sort(
        (x, y) =>
          compare(x.surname, y.surname) ||
          compare(x.givenNames, y.givenNames) ||
          compare(x.id, y.id)
      )
      .slice(0, MAX_LISTED),
  updatePerson: async ({ person, version, ...scope }) =>
    updated(
      memory,
      scope,
      personsOf(memory, scope),
      person.id,
      person,
      version
    ),
});

const relationshipMethods = (
  memory: Memory
): Pick<
  TreeStore,
  | 'addRelationship'
  | 'findRelationship'
  | 'listRelationships'
  | 'updateRelationship'
> => ({
  addRelationship: async ({ relationship, ...scope }) =>
    savedOrNotFound(
      added(
        memory,
        scope,
        relationshipsOf(memory, scope),
        joinable(memory, scope, relationship),
        relationship
      )
    ),
  findRelationship: async ({ relationshipId, ...scope }) =>
    structuredClone(
      relationshipsOf(memory, scope)?.get(
        parseRelationshipId(relationshipId) as RelationshipId
      )
    ),
  listRelationships: async scope =>
    structuredClone(
      failIfListed(memory, scope, [
        ...(relationshipsOf(memory, scope)?.values() ?? []),
      ])
    )
      .sort((x, y) => compare(x.id, y.id))
      .slice(0, MAX_RELATIONSHIPS),
  updateRelationship: async ({ relationship, version, ...scope }) =>
    updated(
      memory,
      scope,
      relationshipsOf(memory, scope),
      joinable(memory, scope, relationship),
      relationship,
      version,
      saved =>
        saved.type === relationship.type &&
        endsOf(saved).join() === endsOf(relationship).join()
    ),
});

const placeMethods = (
  memory: Memory
): Pick<
  TreeStore,
  'addPlace' | 'findPlace' | 'listPlaces' | 'updatePlace'
> => ({
  addPlace: async ({ place, ...scope }) =>
    savedOrNotFound(
      added(
        memory,
        scope,
        placesOf(memory, scope),
        parsePlaceId(place.id),
        place
      )
    ),
  findPlace: async ({ placeId, ...scope }) =>
    structuredClone(
      placesOf(memory, scope)?.get(parsePlaceId(placeId) as PlaceId)
    ),
  listPlaces: async scope =>
    structuredClone(
      failIfListed(memory, scope, [
        ...(placesOf(memory, scope)?.values() ?? []),
      ])
    )
      .sort((x, y) => compare(x.id, y.id))
      .slice(0, MAX_PLACES),
  updatePlace: async ({ place, version, ...scope }) =>
    updated(
      memory,
      scope,
      placesOf(memory, scope),
      parsePlaceId(place.id),
      place,
      version
    ),
});

/**
 * Saves `place`, then runs `write`. If `write` fails, the Place goes, unless it was saved before
 * the call.
 */
const placedPin = async <Refusal extends 'conflict' | 'not-found'>(
  memory: Memory,
  scope: TreeScope,
  place: PlaceInput,
  write: () => Promise<Result<Pin, Refusal>>
): Promise<Result<Pin, 'not-found' | Refusal>> => {
  const placeId = parsePlaceId(place.id);
  const existed =
    placeId !== undefined && placesOf(memory, scope)?.has(placeId) === true;
  const placed = await placeMethods(memory).addPlace({ ...scope, place });

  if (!placed.ok) {
    return placed;
  }

  const saved = await write();

  if (!saved.ok && !existed) {
    placesOf(memory, scope)?.delete(placeId as PlaceId);
  }

  return saved;
};

const pinMethods = (
  memory: Memory
): Pick<
  TreeStore,
  | 'addPin'
  | 'addPinAt'
  | 'findPin'
  | 'listPins'
  | 'listPinsOn'
  | 'updatePin'
  | 'updatePinAt'
> => {
  const addPin: TreeStore['addPin'] = async ({ pin, ...scope }) => {
    const pinned = pinnable(memory, scope, pin);

    return savedOrNotFound(
      added(memory, scope, pinsOf(memory, scope), pinned?.id, pinned ?? pin)
    );
  };
  const updatePin: TreeStore['updatePin'] = async ({
    pin,
    version,
    ...scope
  }) => {
    const pinned = pinnable(memory, scope, pin);

    return updated(
      memory,
      scope,
      pinsOf(memory, scope),
      pinned?.id,
      pinned ?? pin,
      version
    );
  };

  return {
    addPin,
    addPinAt: async ({ pin, place, ...scope }) =>
      placedPin(memory, scope, place, () =>
        addPin({ ...scope, pin: { ...pin, placeId: place.id } })
      ),
    findPin: async ({ pinId, ...scope }) =>
      structuredClone(pinsOf(memory, scope)?.get(parsePinId(pinId) as PinId)),
    listPins: async scope =>
      spanned(memory, scope).map(({ pin, span }) => ({ ...pin, span })),
    listPinsOn: async ({ day, ...scope }) =>
      spanned(memory, scope, day).map(({ pin }) => pin),
    updatePin,
    updatePinAt: async ({ pin, place, version, ...scope }) =>
      placedPin(memory, scope, place, () =>
        updatePin({
          ...scope,
          pin: { ...pin, placeId: place.id },
          version,
        })
      ),
  };
};

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
): TreeStore => {
  const memory = seeded(seed, readOnly, failing);

  return {
    ...accountMethods(memory),
    ...personMethods(memory),
    ...pinMethods(memory),
    ...placeMethods(memory),
    ...relationshipMethods(memory),
  };
};
