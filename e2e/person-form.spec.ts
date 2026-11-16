import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// A name no other test uses, so the list has one row for it.
const surname = () => `Synth${crypto.randomUUID().slice(0, 8)}`;

const create = async (page: Page, family: string) => {
  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
};

// PPL-01
test('creating a Person shows the toast and lists them', async ({ page }) => {
  const family = surname();

  await create(page, family);

  await expect(
    page.getByRole('status').filter({ hasText: 'Saved' })
  ).toHaveText(`Saved Ana ${family}.`);
  await expect(page.getByText(`${family}, Ana`, { exact: true })).toBeVisible();
});

// PPL-01
test('an edit stays after a reload', async ({ page }) => {
  const family = surname();

  await create(page, family);
  await page.getByText(`${family}, Ana`, { exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);

  const edit = page.url();

  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByLabel('Birth').fill('ABT 1850');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
  await page.goto(edit);

  await expect(page.getByLabel('Maiden name')).toHaveValue('Botha');
  await expect(page.getByLabel('Birth')).toHaveValue('ABT 1850');
  await expect(
    page.getByRole('heading', { name: `Edit Ana ${family}` })
  ).toBeVisible();
});

// PPL-01
test('Back to an edit page after a save shows the saved values and saves again', async ({
  page,
}) => {
  const family = surname();

  await create(page, family);
  await page.getByText(`${family}, Ana`, { exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);
  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
  await page.goBack();

  await expect(page.getByLabel('Maiden name')).toHaveValue('Botha');

  await page.getByLabel('Maiden name').fill('Joubert');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');

  await expect(
    page.getByText('This person changed while you were editing')
  ).toHaveCount(0);
});

// PPL-01
test('Cancel after a change leaves at once and drops the change', async ({
  page,
}) => {
  const family = surname();

  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('link', { name: 'Cancel' }).click();
  await page.waitForURL(url => url.pathname === '/people');

  await expect(page.getByText(`${family}, Ana`, { exact: true })).toHaveCount(
    0
  );
});

// PPL-02
test('the Relationships link of a list row and of the edit page reach the page', async ({
  page,
}) => {
  const family = surname();

  await create(page, family);
  await page
    .getByRole('link', { name: new RegExp(`^Relationships.*${family}, Ana$`) })
    .click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}\/relationships$/);
  await expect(
    page.getByRole('heading', { name: 'Relationships' })
  ).toBeVisible();

  await page.goBack();
  await page.getByText(`${family}, Ana`, { exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);
  await page.getByRole('link', { name: 'Relationships' }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}\/relationships$/);
  await expect(
    page.getByRole('heading', { name: 'Relationships' })
  ).toBeVisible();
});

const openEdit = async (page: Page, family: string) => {
  await create(page, family);
  await page.getByText(`${family}, Ana`, { exact: true }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);

  return page.url();
};

// PPL-02, NFR-05
test('Relationships after no edit reaches the page with no warning', async ({
  page,
}) => {
  await openEdit(page, surname());
  await page.getByRole('link', { name: 'Relationships' }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}\/relationships$/);

  await expect(page.getByRole('dialog')).toHaveCount(0);
});

// PPL-02, NFR-05
test('Relationships after an edit warns, and Keep editing keeps the change', async ({
  page,
}) => {
  const edit = await openEdit(page, surname());

  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByRole('link', { name: 'Relationships' }).click();

  const dialog = page.getByRole('dialog', { name: 'Leave without saving?' });

  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Keep editing' })
  ).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: 'Leave without saving' })
  ).toBeVisible();

  await dialog.getByRole('button', { name: 'Keep editing' }).click();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(edit);
  await expect(page.getByLabel('Maiden name')).toHaveValue('Botha');
});

// PPL-02, NFR-05
test('Leave without saving reaches the page and drops the change', async ({
  page,
}) => {
  const edit = await openEdit(page, surname());

  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByRole('link', { name: 'Relationships' }).click();
  await page.getByRole('link', { name: 'Leave without saving' }).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}\/relationships$/);
  await page.goto(edit);

  await expect(page.getByLabel('Maiden name')).toHaveValue('');
});

// PPL-02, NFR-05
test('Cancel and the back link after an edit show no warning', async ({
  page,
}) => {
  const edit = await openEdit(page, surname());

  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByRole('link', { name: 'Cancel' }).click();
  await page.waitForURL(url => url.pathname === '/people');
  await page.goto(edit);
  await page.getByLabel('Maiden name').fill('Botha');
  await page.getByRole('link', { name: 'People' }).click();
  await page.waitForURL(url => url.pathname === '/people');

  await expect(page.getByRole('dialog')).toHaveCount(0);
});

// PPL-02
test('/people/new has no Relationships link', async ({ page }) => {
  await page.goto('/people/new');

  await expect(page.getByLabel('Given names')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Relationships' })).toHaveCount(
    0
  );
});

// PPL-01
test('an id with no Person shows the not-found state', async ({ page }) => {
  await page.goto('/people/01900000-0000-7000-8000-0000000000ff');

  await expect(page.getByText('Person not found')).toBeVisible();
});

// PPL-02, NFR-09
test('the Relationships page is never cached', async ({ page }) => {
  const response = await page.goto('/people/nope/relationships');

  expect(response?.headers()['cache-control']).toBe('private, no-store');
  await expect(page.getByText('Person not found')).toBeVisible();
});

// PPL-01, NFR-09
for (const path of ['/people/new', '/people/nope']) {
  test(`${path} is never cached and covers the whole screen`, async ({
    page,
  }) => {
    const response = await page.goto(path);

    expect(response?.headers()['cache-control']).toBe('private, no-store');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /viewport-fit=cover/
    );
  });
}
