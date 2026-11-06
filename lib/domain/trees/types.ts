import type { AccountId, TreeId } from '@ks/lib/domain/ids/types.ts';
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

/** Every read takes the Account id and joins `tree_account`, so no read skips the check. */
export type TreeStore = {
  /** Creates the Account, a Tree and the link in one step; `exists` if the identity has an Account. */
  addAccount: (
    input: NewAccount
  ) => Promise<Result<{ accountId: AccountId; treeId: TreeId }, 'exists'>>;
  /** The Account for a sign-in identity, or undefined. */
  findAccount: (
    issuer: string,
    subject: string
  ) => Promise<Account | undefined>;
  /** The Tree only if the Account may access it; otherwise undefined, as for a missing Tree or an id that isn't a UUID. */
  findTree: (ids: {
    accountId: AccountId;
    treeId: TreeId;
  }) => Promise<Tree | undefined>;
  /** The Account's Trees ordered by id; empty for an Account with none, an unknown id or an id that isn't a UUID. */
  findTrees: (accountId: AccountId) => Promise<Tree[]>;
};

/** Whoever reads a Tree: an Account now; publishing adds anyone (NFR-10). Only `openTree` makes one. */
export type Viewer = { accountId: AccountId };
