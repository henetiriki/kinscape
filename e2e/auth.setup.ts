import { test as setup } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { signIn } from '@ks/e2e/session';
import { authStateFor } from '@ks/lib/design/check.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

// The synthetic Account behind the test-only memory sign-in (server/auth/synthetic.mts).
const SYNTHETIC = {
  email: 'synthetic@example.test',
  password: 'synthetic-password',
};

// The fixture Accounts that an entry of design/screens.json names.
const named = new Set(
  (
    JSON.parse(
      readFileSync(join(process.cwd(), 'design/screens.json'), 'utf8')
    ) as { screens: { account?: string }[] }
  ).screens.flatMap(({ account }) => (account ? [account] : []))
);

// NFR-03: signs in once, through the form; every project that needs a session reuses the state.
setup('sign in as the synthetic Account', async ({ page }) => {
  await signIn(page, SYNTHETIC, authStateFor());
});

// The fixture Accounts exist only under the memory adapters.
for (const fixture of FIXTURES.filter(({ email }) => named.has(email))) {
  setup(`sign in as ${fixture.email} @fixture`, async ({ page }) => {
    await signIn(page, fixture, authStateFor(fixture.email));
  });
}
