import type { Generated } from 'kysely';

/** Tables as Kysely sees them: camelCase, mapped to snake_case by `CamelCasePlugin`. */
export type Database = {
  account: {
    id: Generated<string>;
    issuer: string;
    subject: string;
  };
  schemaMigration: {
    appliedAt: Generated<Date>;
    checksum: string;
    name: string;
  };
  session: {
    accountId: string;
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
    id: Generated<string>;
    name: string;
  };
  treeAccount: {
    accountId: string;
    treeId: string;
  };
};
