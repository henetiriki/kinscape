import type { AccountId, PersonId, TreeId } from '@ks/lib/domain/ids/types.ts';
import type { Person, PersonInput } from '@ks/lib/domain/persons/types.ts';
import type { Result } from '@ks/lib/domain/result/types.ts';

export type Account = { id: AccountId };

export type NewAccount = {
  issuer: string;
  subject: string;
  treeName: string;
};

/** A synthetic Account for `memoryStore`; `trees` may be empty. */
export type SeedAccount = {
  id: AccountId;
  issuer: string;
  subject: string;
  trees: Tree[];
};

export type Tree = { id: TreeId; name: string };

/** Whose Tree a Person method reads or writes. Every method checks that the Account may access the Tree. */
export type TreeScope = { accountId: AccountId; treeId: TreeId };

/** Every read takes the Account id and joins `tree_account`, so no read skips the check. */
export type TreeStore = {
  /** Creates the Account, a Tree and the link in one step; `exists` if the identity has an Account. */
  addAccount: (
    input: NewAccount
  ) => Promise<Result<{ accountId: AccountId; treeId: TreeId }, 'exists'>>;
  /**
   * Saves a new Person at version 1 and returns it. A second call with the same id changes
   * nothing and returns the Person already saved. Undefined if the Account may not access the Tree.
   */
  addPerson: (
    input: { person: PersonInput } & TreeScope
  ) => Promise<Person | undefined>;
  /** The Account for a sign-in identity, or undefined. */
  findAccount: (
    issuer: string,
    subject: string
  ) => Promise<Account | undefined>;
  /** The Person, or undefined if missing, in another Tree or in a Tree the Account may not access. */
  findPerson: (
    input: { personId: PersonId } & TreeScope
  ) => Promise<Person | undefined>;
  /** The Tree only if the Account may access it; otherwise undefined, as for a missing Tree or an id that isn't a UUID. */
  findTree: (ids: {
    accountId: AccountId;
    treeId: TreeId;
  }) => Promise<Tree | undefined>;
  /** The Account's Trees ordered by id; empty for an Account with none, an unknown id or an id that isn't a UUID. */
  findTrees: (accountId: AccountId) => Promise<Tree[]>;
  /**
   * At most `MAX_LISTED` Persons, ordered by surname, given names, then id. Empty if the Account
   * may not access the Tree.
   */
  listPersons: (scope: TreeScope) => Promise<Person[]>;
  /**
   * Replaces the Person if `version` is the one saved. `conflict` for a stale version; `not-found`
   * for a missing Person, another Account's Tree or an id that isn't a UUID.
   */
  updatePerson: (
    input: { person: PersonInput; version: number } & TreeScope
  ) => Promise<Result<Person, 'conflict' | 'not-found'>>;
};

/** Whoever reads a Tree: an Account now; publishing adds anyone (NFR-10). Only `openTree` makes one. */
export type Viewer = { accountId: AccountId };
