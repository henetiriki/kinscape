import type { Generated } from 'kysely';

import type { Qualifier } from '@ks/lib/domain/dates/types.ts';
import type { AccountId, PersonId, TreeId } from '@ks/lib/domain/ids/types.ts';
import type { Precision } from '@ks/lib/domain/map/types.ts';
import type { Sex } from '@ks/lib/domain/persons/types.ts';

/** Tables as Kysely sees them: camelCase, mapped to snake_case by `CamelCasePlugin`. */
export type Database = {
  account: {
    id: Generated<AccountId>;
    issuer: string;
    subject: string;
  };
  person: {
    createdAt: Generated<Date>;
    deceased: boolean;
    givenNames: string;
    id: PersonId;
    maidenName: string;
    notes: string;
    sex: Sex;
    surname: string;
    treeId: TreeId;
    updatedAt: Generated<Date>;
    variants: string[];
    version: Generated<number>;
  } & FuzzyDateColumnsOf<'birth'> &
    FuzzyDateColumnsOf<'death'>;
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

/** The FuzzyDate columns under a prefix: `birth` gives `birthDate1`. */
export type FuzzyDateColumnsOf<Prefix extends string> = {
  [
    Key in keyof FuzzyDateColumns as `${Prefix}${Capitalize<Key>}`
  ]: FuzzyDateColumns[Key];
};

/** The six columns of a FuzzyDate; all null when there is no date. */
type FuzzyDateColumns = {
  date1: null | string;
  date2: null | string;
  precision: null | Precision;
  qualifier: null | Qualifier;
  validFrom: null | number;
  validTo: null | number;
};
