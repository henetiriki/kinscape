import { randomUUID } from 'node:crypto';

import type {
  AccountId,
  PersonId,
  RelationshipId,
  TreeId,
} from '#ks/lib/domain/ids/types.ts';
import type { Person } from '#ks/lib/domain/persons/types.ts';
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
  parseRelationshipId,
  parseTreeId,
} from '#ks/lib/domain/ids/ids.mts';
import { MAX_LISTED } from '#ks/lib/domain/persons/schemas.mts';
import { endsOf } from '#ks/lib/domain/relationships/rules.mts';
import { MAX_RELATIONSHIPS } from '#ks/lib/domain/relationships/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

/** Code-point order: the byte order of UTF-8, as `collate "C"` gives in Postgres. */
const compare = (x: string, y: string): number =>
  Buffer.compare(Buffer.from(x), Buffer.from(y));

const identityOf = (issuer: string, subject: string) =>
  JSON.stringify([issuer, subject]);

/** A TreeStore in memory, for tests and the test-only adapters. `seed` Accounts may have no Tree. */
export const memoryStore = (seed: SeedAccount[] = []): TreeStore => {
  const accounts = new Map<string, AccountId>();
  const trees = new Map<TreeId, Tree>();
  const links = new Map<AccountId, Set<TreeId>>();

  for (const { id, issuer, subject, trees: owned } of seed) {
    accounts.set(identityOf(issuer, subject), id);
    links.set(id, new Set(owned.map(tree => tree.id)));

    for (const tree of owned) {
      trees.set(tree.id, tree);
    }
  }

  const ownedBy = (accountId: AccountId) => [...(links.get(accountId) ?? [])];
  const persons = new Map<TreeId, Map<PersonId, Person>>();

  /** The Persons of a Tree the Account may access; undefined otherwise. */
  const personsOf = ({ accountId, treeId }: TreeScope) =>
    links.get(accountId)?.has(treeId) && trees.has(treeId)
      ? (persons.get(treeId) ?? persons.set(treeId, new Map()).get(treeId)!)
      : undefined;

  const relationships = new Map<TreeId, Map<RelationshipId, Relationship>>();

  /** The Relationships of a Tree the Account may access; undefined otherwise. */
  const relationshipsOf = (scope: TreeScope) =>
    personsOf(scope) === undefined
      ? undefined
      : (relationships.get(scope.treeId) ??
        relationships.set(scope.treeId, new Map()).get(scope.treeId)!);

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
      const owned = personsOf(scope);

      if (owned === undefined || parsePersonId(person.id) === undefined) {
        return undefined;
      }

      if (!owned.has(person.id)) {
        owned.set(person.id, { ...structuredClone(person), version: 1 });
      }

      return structuredClone(owned.get(person.id));
    },
    addRelationship: async ({ relationship, ...scope }) => {
      const owned = relationshipsOf(scope);
      const id = joinable(scope, relationship);

      if (owned === undefined || id === undefined) {
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
      structuredClone([...(personsOf(scope)?.values() ?? [])])
        .sort(
          (x, y) =>
            compare(x.surname, y.surname) ||
            compare(x.givenNames, y.givenNames) ||
            compare(x.id, y.id)
        )
        .slice(0, MAX_LISTED),
    listRelationships: async scope =>
      structuredClone([...(relationshipsOf(scope)?.values() ?? [])])
        .sort((x, y) => compare(x.id, y.id))
        .slice(0, MAX_RELATIONSHIPS),
    updatePerson: async ({ person, version, ...scope }) => {
      const owned = personsOf(scope);
      const saved = owned?.get(person.id);

      if (owned === undefined || saved === undefined) {
        return err('not-found');
      }

      if (saved.version !== version) {
        return err('conflict');
      }

      const next = { ...structuredClone(person), version: version + 1 };

      owned.set(person.id, next);

      return ok(structuredClone(next));
    },
    updateRelationship: async ({ relationship, version, ...scope }) => {
      const owned = relationshipsOf(scope);
      const id = joinable(scope, relationship);
      const saved = id === undefined ? undefined : owned?.get(id);

      if (
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
