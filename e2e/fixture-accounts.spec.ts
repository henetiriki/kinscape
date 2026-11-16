import { expect, test } from '@playwright/test';

import { FIXTURES } from '@ks/server/auth/fixtures.mts';

const [researcher] = FIXTURES;

// These start signed out: a signed-in visitor never sees the form.
test.use({ storageState: { cookies: [], origins: [] } });

// NFR-03
test('the researcher fixture Account signs in and sees no People', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(researcher.email);
  await page.getByLabel('Password', { exact: true }).fill(researcher.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/');
  await page.goto('/people');

  await expect(page.getByText('No people yet')).toBeVisible();
});
