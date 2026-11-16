import { parseAccountId, parseTreeId } from '#ks/lib/domain/ids/ids.mts';

/**
 * The fixture Accounts that only the memory adapters hold. Each Tree is read-only. No `server-only`,
 * so `e2e/` can import it under plain Node. The passwords differ from the wrong
 * passwords of the sign-in tests.
 */
export const FIXTURES = [
  {
    accountId: parseAccountId('00000000-0000-4000-8000-0000000000a2')!,
    email: 'researcher@example.com',
    issuer: 'fixture',
    password: 'researcher-password',
    subject: 'researcher',
    treeId: parseTreeId('00000000-0000-4000-8000-0000000000b2')!,
    treeName: 'Researcher Tree',
  },
];
