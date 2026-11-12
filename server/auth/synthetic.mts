import { parseAccountId, parseTreeId } from '#ks/lib/domain/ids/ids.mts';

/**
 * The one synthetic user and Tree behind the test-only memory sign-in. No `server-only`, so
 * `scripts/seed-ci.mts` can import it under plain Node.
 */
export const SYNTHETIC = {
  accountId: parseAccountId('00000000-0000-4000-8000-0000000000a1')!,
  email: 'synthetic@example.test',
  issuer: 'synthetic',
  password: 'synthetic-password',
  subject: 'synthetic-subject',
  treeId: parseTreeId('00000000-0000-4000-8000-0000000000b1')!,
  treeName: 'Synthetic Tree',
};
