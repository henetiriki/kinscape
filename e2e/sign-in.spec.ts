import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

const SESSION_COOKIE = '__Host-kinscape-session';
// The synthetic Account behind the test-only memory sign-in (server/auth/synthetic.mts).
const SYNTHETIC = {
  email: 'synthetic@example.test',
  password: 'synthetic-password',
};

// These start signed out: a signed-in visitor never sees the form.
test.use({ storageState: { cookies: [], origins: [] } });

const signIn = async (page: Page, email: string, password: string) => {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

// NFR-03
test('wrong details show the error, keep the email and empty the password', async ({
  page,
}) => {
  await page.goto('/sign-in');
  // researcher@example.com has no Account, as in the design snapshots.
  await signIn(page, 'researcher@example.com', 'not-the-password');

  await expect(
    page.getByRole('alert').filter({ hasText: "don't match" })
  ).toContainText("That email and password don't match.");
  await expect(page.getByLabel('Email')).toHaveValue('researcher@example.com');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await expect(page).toHaveURL(/\/sign-in$/);
});

// NFR-03
test('the right details open the map and set the session cookie', async ({
  context,
  page,
}) => {
  await page.goto('/sign-in');
  await signIn(page, SYNTHETIC.email, SYNTHETIC.password);
  await page.waitForURL(url => url.pathname === '/');

  const cookie = (await context.cookies()).find(
    ({ name }) => name === SESSION_COOKIE
  );

  expect(cookie).toMatchObject({ httpOnly: true, secure: true });
});

// NFR-03
test('a signed-in visitor to the sign-in page gets the map', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await signIn(page, SYNTHETIC.email, SYNTHETIC.password);
  await page.waitForURL(url => url.pathname === '/');
  await page.goto('/sign-in');

  await expect(page).toHaveURL(url => url.pathname === '/');
});

// NFR-03
test('a return-to address on another site opens the map instead', async ({
  page,
}) => {
  await page.goto('/sign-in?returnTo=https://example.test/');
  await signIn(page, SYNTHETIC.email, SYNTHETIC.password);

  await page.waitForURL(url => url.pathname === '/');

  expect(new URL(page.url()).origin).toBe('http://localhost:3000');
});
