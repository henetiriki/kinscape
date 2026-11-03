import type { Result } from '@ks/lib/domain/result/types.ts';

export type Account = { id: string };

export type NewAccount = {
  issuer: string;
  subject: string;
  treeName: string;
};

/** A synthetic Account for `memoryStore`; `trees` may be empty. */
export type SeedAccount = {
  id: string;
  issuer: string;
  subject: string;
  trees: Tree[];
};

export type Tree = { id: string; name: string };

/** Every read takes the Account id and joins `tree_account`, so no read skips the check. */
export type TreeStore = {
  /** Creates the Account, a Tree and the link in one step; `exists` if the identity has an Account. */
  addAccount: (
    input: NewAccount
  ) => Promise<Result<{ accountId: string; treeId: string }, 'exists'>>;
  /** The Account for a sign-in identity, or undefined. */
  findAccount: (
    issuer: string,
    subject: string
  ) => Promise<Account | undefined>;
  /** The Tree only if the Account may access it; otherwise undefined, as for a missing Tree. */
  findTree: (accountId: string, treeId: string) => Promise<Tree | undefined>;
  /** The Account's Trees ordered by id; empty for an Account with none or an unknown id. */
  findTrees: (accountId: string) => Promise<Tree[]>;
};

/** Who is asking: an Account id, or none. */
export type Viewer = { accountId?: string };
