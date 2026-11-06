import type { Generated } from 'kysely';

import type { AccountId, TreeId } from '@ks/lib/domain/ids/types.ts';

/** Tables as Kysely sees them: camelCase, mapped to snake_case by `CamelCasePlugin`. */
export type Database = {
  account: {
    id: Generated<AccountId>;
    issuer: string;
    subject: string;
  };
  schemaMigration: {
    appliedAt: Generated<Date>;
    checksum: string;
    name: string;
  };
  session: {
    accountId: AccountId;
    createdAt: Date;
    email: string;
    expiresAt: Date;
    tokenHash: string;
  };
  signInFailure: {
    emailKey: string;
    failedAt: Date;
  };
  tree: {
    id: Generated<TreeId>;
    name: string;
  };
  treeAccount: {
    accountId: AccountId;
    treeId: TreeId;
  };
};
