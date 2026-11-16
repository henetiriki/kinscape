import type { Page } from '@playwright/test';

import { expect, test as setup } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const signIn = async (
  page: Page,
  { email, password }: { email: string; password: string },
  path: string
) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
  await page.context().storageState({ path });
};

// NFR-03: signs in once, through the form; every project that needs a session reuses the state.
setup('sign in as the synthetic Account', async ({ page }) => {
  await signIn(page, SYNTHETIC, authStateFor());
});

// The fixture Accounts exist only under the memory adapters.
for (const fixture of FIXTURES.filter(({ email }) => named.has(email))) {
  setup(`sign in as ${fixture.email}`, async ({ page }) => {
    setup.skip(
      process.env.KINSCAPE_MEMORY_SIGN_IN === '1',
      'The memory sign-in has no fixture Account.'
    );
    await signIn(page, fixture, authStateFor(fixture.email));
  });
}
