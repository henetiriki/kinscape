import { expect, test as setup } from '@playwright/test';

// The path the other projects load (playwright.config.ts).
const AUTH_STATE = 'test-results/.auth/state.json';

// The synthetic user behind the test-only memory adapters (server/adapters.mts).
const SYNTHETIC = {
  email: 'synthetic@example.test',
  password: 'synthetic-password',
};

// NFR-03: signs in once, through the form; every project that needs a session reuses the state.
setup('sign in as the synthetic Account', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(SYNTHETIC.email);
  await page.getByLabel('Password', { exact: true }).fill(SYNTHETIC.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
  await page.context().storageState({ path: AUTH_STATE });
});
