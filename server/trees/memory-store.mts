import { randomUUID } from 'node:crypto';

import type { AccountId, PersonId, TreeId } from '#ks/lib/domain/ids/types.ts';
import type { Person } from '#ks/lib/domain/persons/types.ts';
import type {
  SeedAccount,
  Tree,
  TreeScope,
  TreeStore,
} from '#ks/lib/domain/trees/types.ts';

import {
  parseAccountId,
  parsePersonId,
  parseTreeId,
} from '#ks/lib/domain/ids/ids.mts';
import { MAX_LISTED } from '#ks/lib/domain/persons/schemas.mts';
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
    findAccount: async (issuer, subject) => {
      const id = accounts.get(identityOf(issuer, subject));

      return id === undefined ? undefined : { id };
    },
    findPerson: async ({ personId, ...scope }) =>
      structuredClone(personsOf(scope)?.get(personId)),
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
  };
};
