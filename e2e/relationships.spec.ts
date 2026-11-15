import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// A name no other test uses, so the list has one row for it.
const surname = () => `Synth${crypto.randomUUID().slice(0, 8)}`;

/** Saves a Person and returns the address of the Relationships page of that Person. */
const create = async (page: Page, family: string, given: string) => {
  await page.goto('/people/new');
  await page.getByLabel('Given names').fill(given);
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
  await page.getByText(`${family}, ${given}`).click();
  await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);

  return `${new URL(page.url()).pathname}/relationships`;
};

// PPL-02
test('an adoptive parent shows on both Relationships pages', async ({
  page,
}) => {
  const family = surname();
  const childPage = await create(page, family, 'Child');
  const parentPage = await create(page, family, 'Parent');

  await page.goto(childPage);
  await page
    .getByRole('region', { name: 'Parents' })
    .getByRole('button', { name: 'Add' })
    .click();
  await page.getByLabel('Find a person').fill(family);
  await page
    .getByRole('button', { name: new RegExp(`${family}, Parent`) })
    .click();
  await page.getByRole('radio', { name: 'Adoptive' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page
      .getByRole('region', { name: 'Parents' })
      .getByText(`${family}, Parent`, { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Parents' }).getByText('Adoptive')
  ).toBeVisible();

  await page.goto(parentPage);

  await expect(
    page
      .getByRole('region', { name: 'Children' })
      .getByText(`${family}, Child`, { exact: true })
  ).toBeVisible();
});

// PPL-02
test('a link that would make a cycle shows its reason and saves nothing', async ({
  page,
}) => {
  const family = surname();
  const childPage = await create(page, family, 'Child');

  await create(page, family, 'Parent');
  await page.goto(childPage);
  await page
    .getByRole('region', { name: 'Parents' })
    .getByRole('button', { name: 'Add' })
    .click();
  await page.getByLabel('Find a person').fill(family);
  await page
    .getByRole('button', { name: new RegExp(`${family}, Parent`) })
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  // The Parent now has the Child as a parent too: that makes the Child their own ancestor.
  await page
    .getByRole('region', { name: 'Children' })
    .getByRole('button', { name: 'Add' })
    .click();
  await page.getByLabel('Find a person').fill(family);
  await page
    .getByRole('button', { name: new RegExp(`${family}, Parent`) })
    .click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText("This link isn't possible")).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});

// PPL-02
test('a divorce edit stays after a reload', async ({ page }) => {
  const family = surname();
  const first = await create(page, family, 'Wife');

  await create(page, family, 'Husband');
  await page.goto(first);
  await page
    .getByRole('region', { name: 'Spouses' })
    .getByRole('button', { name: 'Add' })
    .click();
  await page.getByLabel('Find a person').fill(family);
  await page
    .getByRole('button', { name: new RegExp(`${family}, Husband`) })
    .click();
  await page.getByLabel('Marriage').fill('1875');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page
    .getByRole('region', { name: 'Spouses' })
    .getByRole('link', { name: /Edit/ })
    .click();
  // The dialog of "Add" is still in the page, closed, with its own Divorce field.
  await page.getByRole('dialog').getByLabel('Divorce').fill('1890');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();

  await expect(
    page.getByRole('region', { name: 'Spouses' }).getByText('div. 1890')
  ).toBeVisible();
});

// PPL-02
test('a divorce before the marriage shows the alert and saves nothing', async ({
  page,
}) => {
  const family = surname();
  const first = await create(page, family, 'Wife');

  await create(page, family, 'Husband');
  await page.goto(first);
  await page
    .getByRole('region', { name: 'Spouses' })
    .getByRole('button', { name: 'Add' })
    .click();
  await page.getByLabel('Find a person').fill(family);
  await page
    .getByRole('button', { name: new RegExp(`${family}, Husband`) })
    .click();
  await page.getByLabel('Marriage').fill('1890');
  await page.getByLabel('Divorce').fill('1875');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByText('The divorce is before the marriage')
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
});
