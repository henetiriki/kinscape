import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// NFR-05, NFR-06: board 07, the Menu, Avatar and Popup.

const COPIED =
  'District: Kimberley\nColony: Cape Colony (Was Griqualand West until 1880)';

const avatar = (page: Page) =>
  page
    .getByRole('region', { name: 'Menu' })
    .getByRole('button', { name: 'Account menu' })
    .first();

// The open menu belongs to the Avatar's Default cell; the drawn one above is only a look.
const menu = (page: Page) =>
  page.getByRole('figure', { name: 'Avatar states' }).getByRole('menu');

test.describe('on a desktop', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  test('Down then Enter activates the second item; Esc returns focus to the Avatar', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces?part=2');
    await avatar(page).click();
    await expect(menu(page).getByRole('menuitem').first()).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', {
      name: 'Sources and attributions',
    });

    await expect(dialog).toBeVisible();
    await expect(menu(page)).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(avatar(page)).toBeFocused();
  });

  test('Esc closes the Menu and puts focus on the Avatar', async ({ page }) => {
    await page.goto('/design-kit/surfaces?part=2');
    await avatar(page).click();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toBeHidden();
    await expect(avatar(page)).toBeFocused();
  });

  test('Tab leaves the Menu and closes it', async ({ page }) => {
    await page.goto('/design-kit/surfaces?part=2');
    await avatar(page).click();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(menu(page)).toBeHidden();
    expect(
      await page.evaluate(() => document.activeElement?.closest('[role=menu]'))
    ).toBeNull();
  });

  test('Copy chain copies a line per level and shows the success Toast', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/design-kit/surfaces?part=2');
    await page.getByRole('button', { name: 'Copy chain' }).first().click();

    await expect(
      page.getByRole('status').filter({ hasText: 'Jurisdiction chain copied.' })
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      COPIED
    );
  });

  test('Close and Copy chain keep a 44 × 44 hit area', async ({ page }) => {
    await page.goto('/design-kit/surfaces?part=2');

    const popup = page.getByRole('dialog', {
      name: 'Jurisdiction at this point',
    });

    for (const name of ['Close', 'Copy chain']) {
      const button = popup.getByRole('button', { name });

      await button.scrollIntoViewIfNeeded();

      const box = (await button.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      for (const [dx, dy] of [
        [21, 0],
        [-21, 0],
        [0, 21],
        [0, -21],
      ]) {
        expect(
          await button.evaluate(
            (node, [px, py]) =>
              document.elementFromPoint(px, py)?.closest('button') === node,
            [x + dx, y + dy]
          ),
          `${name} at ${dx},${dy}`
        ).toBe(true);
      }
    }
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('part 2 shows the sheet Popup alone, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces?part=2');

    await expect(
      page.getByRole('region', { name: 'On this spot in 1901' })
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Copy chain' })).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
