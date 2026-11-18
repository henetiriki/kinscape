import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { FIXTURES, MARIA } from '@ks/server/auth/fixtures.mts';

const [researcher, family, alone] = FIXTURES;

// These start signed out: a signed-in visitor never sees the form.
test.use({ storageState: { cookies: [], origins: [] } });

const signInAs = async (
  page: Page,
  { email, password }: { email: string; password: string }
) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/');
};

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

// NFR-03
test('the family fixture Account sees 13 People, the Relationships and the form of Maria', async ({
  page,
}) => {
  await signInAs(page, family);
  await page.goto('/people');

  await expect(
    page.getByText('13 people in this Tree, by surname')
  ).toBeVisible();

  await page.goto(`/people/${MARIA.id}/relationships`);

  for (const name of [
    'Jacobus',
    'Johanna Petronella',
    'Cornelis',
    'Hendrik Willem',
    'Susanna',
    'Gerrit',
    'Pieter',
  ]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }

  await expect(page.getByText('3 links').first()).toBeVisible();

  await page.goto(`/people/${MARIA.id}`);

  await expect(page.getByLabel('Maiden name')).toHaveValue('Rossouw');
  await expect(page.getByLabel('Notes')).toHaveValue(MARIA.notes!);

  for (const variant of MARIA.variants) {
    await expect(page.getByText(variant).first()).toBeVisible();
  }
});

// NFR-03
test('the alone fixture Account sees one Person and no Relationship', async ({
  page,
}) => {
  await signInAs(page, alone);
  await page.goto('/people');

  await expect(
    page.getByText('1 person in this Tree, by surname')
  ).toBeVisible();

  await page.goto(`/people/${MARIA.id}/relationships`);

  for (const title of ['Parents', 'Spouses', 'Children']) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await expect(page.getByText('0 links')).toHaveCount(3);
});
