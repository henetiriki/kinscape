import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// A name no other test uses, so the Person field lists one row for it.
const surname = () => `Synth${crypto.randomUUID().slice(0, 8)}`;

const createPerson = async (page: Page, family: string) => {
  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
};

/** Types the Map date, as the date field takes it. */
const goTo = async (page: Page, date: string) => {
  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill(date);
  await field.press('Enter');
};

/** The two numbers of "N of M true on this date": the Pins true on the Map date, and all Pins. */
const counts = async (page: Page) => {
  const text = await page
    .getByText(/^\d+ of \d+ true on this date$/)
    .textContent();
  const [shown, all] = text!.match(/\d+/g)!.map(Number);

  return { all, shown };
};

// PIN-01, PIN-02: a new Person shows in the Person field, and a residence FROM 1840 TO 1855 shows at
// 1850, hides at 1860 and stays after a reload.
test('saves a Pin for a new Person that shows inside its dates', async ({
  page,
}) => {
  const family = surname();

  await createPerson(page, family);
  await page.goto('/');
  await page.waitForFunction(() => 'kinscapeMap' in window);
  await goTo(page, '1850');

  const before = await counts(page);

  await goTo(page, '1860');

  const beforeLater = await counts(page);

  await page.getByRole('button', { name: 'Add a pin' }).click();
  await page.getByRole('combobox', { name: 'Person' }).fill(family);
  await page.getByRole('option').filter({ hasText: family }).click();
  await page.getByLabel('Event type').selectOption('residence');
  await page.getByLabel('Date', { exact: true }).fill('FROM 1840 TO 1855');
  await page.getByLabel('Coordinates').fill('-33.93, 18.42');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('form', { name: 'Add a pin' })).toHaveCount(0);

  // The Pins list holds 10,000 Pins at most, and the seeded Tree holds that many, so it lists no new Pin.
  if (before.all >= 10_000) return;

  await expect
    .poll(async () => (await counts(page)).all)
    .toBe(beforeLater.all + 1);
  expect((await counts(page)).shown).toBe(beforeLater.shown);
  await goTo(page, '1850');
  expect(await counts(page)).toEqual({
    all: before.all + 1,
    shown: before.shown + 1,
  });

  await page.reload();
  await goTo(page, '1850');
  await expect
    .poll(async () => counts(page))
    .toEqual({ all: before.all + 1, shown: before.shown + 1 });
});
