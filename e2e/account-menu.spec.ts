import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// The synthetic Account behind the test-only memory adapters (e2e/auth.setup.ts).
const SYNTHETIC = {
  email: 'synthetic@example.test',
  password: 'synthetic-password',
};

const avatar = (page: Page) =>
  page.getByRole('button', { name: 'Account menu' });
const items = (page: Page) => page.getByRole('menuitem');

const openMenu = async (page: Page) => {
  await page.goto('/');
  await avatar(page).click();
  await expect(page.getByRole('menu', { name: 'Account' })).toBeVisible();
};

test.describe('desktop, 1280 × 800', () => {
  test.use({ viewport: { height: 800, width: 1280 } });

  // NFR-03
  test('the menu shows the email and two items, and no Export or backup', async ({
    page,
  }) => {
    await openMenu(page);

    await expect(page.getByText(SYNTHETIC.email)).toBeVisible();
    await expect(items(page)).toHaveText([
      'Sources and attributions',
      'Sign out',
    ]);
    await expect(page.getByText(/export|backup/i)).toHaveCount(0);
  });

  // NFR-03
  test('Sources and attributions opens the Sources dialog', async ({
    page,
  }) => {
    await openMenu(page);
    await items(page).first().click();
    await expect(page.getByRole('dialog', { name: /sources/i })).toBeVisible();
  });
});

test.describe('own session', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { height: 800, width: 1280 },
  });

  // NFR-03: signs in on its own, so signing out leaves the shared session alone.
  test('Sign out shows the sign-in page and the map is no longer reachable', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(SYNTHETIC.email);
    await page.getByLabel('Password', { exact: true }).fill(SYNTHETIC.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(url => url.pathname === '/');
    await avatar(page).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.waitForURL(url => url.pathname === '/sign-in');

    await page.goto('/');
    await expect(page).toHaveURL(url => url.pathname === '/sign-in');
    await expect(page.locator('canvas.maplibregl-canvas')).toHaveCount(0);
  });
});

test.describe('phone, 390 × 844', () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

  // NFR-05
  test('tapping the Avatar in the search pill opens the menu', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('search')
      .getByRole('button', { name: 'Account menu' })
      .tap();
    await expect(
      page.getByRole('search').getByRole('menu', { name: 'Account' })
    ).toBeVisible();
    await expect(items(page)).toHaveCount(2);
  });

  // NFR-06
  test('the pill draws no focus ring while a menu item has focus', async ({
    page,
  }) => {
    await openMenu(page);
    await expect(items(page).first()).toBeFocused();
    expect(
      await page
        .getByRole('search')
        .evaluate(node => getComputedStyle(node).outlineStyle)
    ).toBe('none');
  });

  // NFR-05
  test('the card paints above the Layers button', async ({ page }) => {
    await openMenu(page);

    const layers = (await page
      .getByRole('button', { name: 'Layers and filters' })
      .boundingBox())!;
    const top = await page.evaluate(
      ({ x, y }) => {
        const hit = document.elementFromPoint(x, y);

        // The card hangs from the pill, which fills the search slot.
        return {
          inCard: !!hit?.closest('[data-slot="search"]'),
          isLayers: !!hit?.closest('[aria-label="Layers and filters"]'),
        };
      },
      { x: layers.x + layers.width / 2, y: layers.y + layers.height / 2 }
    );

    expect(top.isLayers).toBe(false);
    expect(top.inCard).toBe(true);
  });
});
