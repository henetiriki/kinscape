import { randomUUID } from 'node:crypto';

import type {
  AccountId,
  PersonId,
  PlaceId,
  RelationshipId,
  TreeId,
} from '#ks/lib/domain/ids/types.ts';
import type { Person } from '#ks/lib/domain/persons/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';
import type {
  Relationship,
  RelationshipInput,
} from '#ks/lib/domain/relationships/types.ts';
import type {
  SeedAccount,
  Tree,
  TreeScope,
  TreeStore,
} from '#ks/lib/domain/trees/types.ts';

import {
  parseAccountId,
  parsePersonId,
  parsePlaceId,
  parseRelationshipId,
  parseTreeId,
} from '#ks/lib/domain/ids/ids.mts';
import { MAX_LISTED } from '#ks/lib/domain/persons/schemas.mts';
import { MAX_PLACES } from '#ks/lib/domain/places/schemas.mts';
import { endsOf } from '#ks/lib/domain/relationships/rules.mts';
import { MAX_RELATIONSHIPS } from '#ks/lib/domain/relationships/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

/** Code-point order: the byte order of UTF-8, as `collate "C"` gives in Postgres. */
const compare = (x: string, y: string): number =>
  Buffer.compare(Buffer.from(x), Buffer.from(y));

const identityOf = (issuer: string, subject: string) =>
  JSON.stringify([issuer, subject]);

/**
 * A TreeStore in memory, for tests and the test-only adapters. `seed` Accounts may have no Tree.
 * A seed Tree may hold People and Relationships, saved at version 1. The six writes refuse a Tree
 * in `readOnly` as they refuse a Tree the Account may not access. The three list reads of a Tree in
 * `failing` throw.
 */
export const memoryStore = (
  seed: SeedAccount[] = [],
  readOnly: TreeId[] = [],
  failing: TreeId[] = []
): TreeStore => {
  const accounts = new Map<string, AccountId>();
  const trees = new Map<TreeId, Tree>();
  const links = new Map<AccountId, Set<TreeId>>();
  const persons = new Map<TreeId, Map<PersonId, Person>>();
  const relationships = new Map<TreeId, Map<RelationshipId, Relationship>>();
  const places = new Map<TreeId, Map<PlaceId, Place>>();

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
    addPerson: async ({ person, ...scope }) => {
      const owned = frozen(scope) ? undefined : personsOf(scope);

      if (owned === undefined || parsePersonId(person.id) === undefined) {
        return undefined;
      }

      if (!owned.has(person.id)) {
        owned.set(person.id, { ...structuredClone(person), version: 1 });
      }

      return structuredClone(owned.get(person.id));
    },
    addPlace: async ({ place, ...scope }) => {
      const owned = placesOf(scope);
      const id = parsePlaceId(place.id);

      if (frozen(scope) || owned === undefined || id === undefined) {
        return err('not-found');
      }

      if (!owned.has(id)) {
        owned.set(id, { ...structuredClone(place), id, version: 1 });
      }

      return ok(structuredClone(owned.get(id)!));
    },
    addRelationship: async ({ relationship, ...scope }) => {
      const owned = relationshipsOf(scope);
      const id = joinable(scope, relationship);

      if (frozen(scope) || owned === undefined || id === undefined) {
        return err('not-found');
      }

      if (!owned.has(id)) {
        owned.set(id, { ...structuredClone(relationship), id, version: 1 });
      }

      return ok(structuredClone(owned.get(id)!));
    },
    findAccount: async (issuer, subject) => {
      const id = accounts.get(identityOf(issuer, subject));

      return id === undefined ? undefined : { id };
    },
    findPerson: async ({ personId, ...scope }) =>
      structuredClone(personsOf(scope)?.get(personId)),
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
    updatePerson: async ({ person, version, ...scope }) => {
      const owned = personsOf(scope);
      const saved = owned?.get(person.id);

      if (frozen(scope) || owned === undefined || saved === undefined) {
        return err('not-found');
      }

      if (saved.version !== version) {
        return err('conflict');
      }

      const next = { ...structuredClone(person), version: version + 1 };

      owned.set(person.id, next);

      return ok(structuredClone(next));
    },
    updatePlace: async ({ place, version, ...scope }) => {
      const owned = placesOf(scope);
      const id = parsePlaceId(place.id);
      const saved = id === undefined ? undefined : owned?.get(id);

      if (
        frozen(scope) ||
        owned === undefined ||
        id === undefined ||
        saved === undefined
      ) {
        return err('not-found');
      }

      if (saved.version !== version) {
        return err('conflict');
      }

      const next = { ...structuredClone(place), id, version: version + 1 };

      owned.set(id, next);

      return ok(structuredClone(next));
    },
    updateRelationship: async ({ relationship, version, ...scope }) => {
      const owned = relationshipsOf(scope);
      const id = joinable(scope, relationship);
      const saved = id === undefined ? undefined : owned?.get(id);

      if (
        frozen(scope) ||
        owned === undefined ||
        id === undefined ||
        saved === undefined ||
        saved.type !== relationship.type ||
        endsOf(saved).join() !== endsOf(relationship).join()
      ) {
        return err('not-found');
      }

      if (saved.version !== version) {
        return err('conflict');
      }

      const next = {
        ...structuredClone(relationship),
        id,
        version: version + 1,
      };

      owned.set(id, next);

      return ok(structuredClone(next));
    },
  };
};
