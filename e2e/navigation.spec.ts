import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { signOut } from '@ks/e2e/session';

// The synthetic Account behind the test-only memory adapters (e2e/auth.setup.ts).
const SYNTHETIC = {
  email: 'synthetic@example.test',
  password: 'synthetic-password',
};

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type MarkedWindow = { kinscapeMap?: unknown; kinscapeMarker?: unknown };

const field = (page: Page) => page.getByRole('textbox', { name: 'Date shown' });
const layers = (page: Page) =>
  page.getByRole('complementary', { name: 'Layers' });

/** Sets a marker a new document would lose, and the map the page holds. */
const mark = async (page: Page) => {
  await page.waitForFunction(() => 'kinscapeMap' in window);
  await page.evaluate(() => {
    const w = window as unknown as MarkedWindow;

    w.kinscapeMarker = w.kinscapeMap;
  });
};

/** True while the document is the one `mark` marked, and the map is the same object. */
const same = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as MarkedWindow;

    return w.kinscapeMarker !== undefined && w.kinscapeMarker === w.kinscapeMap;
  });

/**
 * Returns a function that is true after the loading-boundary prefetch of a path ends.
 * Next sends it with `Next-Router-Prefetch` and no segment header; its response holds the
 * loading screen. Call this before `page.goto`.
 */
const prefetched = (page: Page, path: string) => {
  let done = false;

  page.on('requestfinished', async request => {
    if (new URL(request.url()).pathname !== path) return;

    const headers = request.headers();

    if (
      headers['next-router-prefetch'] !== '1' ||
      headers['next-router-segment-prefetch'] !== undefined
    )
      return;

    const response = await request.response();

    if (response?.ok()) done = true;
  });

  return () => done;
};

const openPeople = async (page: Page) => {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: /^People/ }).click();
  await expect(page).toHaveURL(url => url.pathname === '/people');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
};

test.describe('desktop, 1280 × 800', () => {
  test.use({ viewport: { height: 800, width: 1280 } });

  // PPL-01, NFR-02
  test('the Account menu, the back link and the form links load no new document', async ({
    page,
  }) => {
    await page.goto('/');
    await mark(page);
    await openPeople(page);
    expect(await same(page)).toBe(true);

    await page.getByRole('link', { name: 'Add a person' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/people/new');
    await expect(page.getByLabel('Given names')).toBeVisible();
    expect(await same(page)).toBe(true);

    await page.getByRole('link', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/people');
    expect(await same(page)).toBe(true);

    await page.getByRole('link', { name: 'Map' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/');
    await expect(field(page)).toBeVisible();
    expect(await same(page)).toBe(true);
  });

  // PPL-01
  test('a People row and Edit open the form with no new document', async ({
    page,
  }) => {
    await page.goto('/people/new');
    await page.getByLabel('Given names').fill('Ana');
    await page.getByLabel('Surname').fill(`Nav${Date.now()}`);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL(url => url.pathname === '/people');
    await page.evaluate(() => {
      (window as unknown as MarkedWindow).kinscapeMarker = 'document';
    });
    await page
      .getByRole('region', { name: 'People, by surname' })
      .getByRole('link')
      .first()
      .click();
    await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);
    expect(
      await page.evaluate(
        () => (window as unknown as MarkedWindow).kinscapeMarker
      )
    ).toBe('document');
  });

  // NFR-02
  test('a modified click and a middle click open a new tab', async ({
    context,
    page,
  }) => {
    await page.goto('/people');

    const link = page.getByRole('link', { name: 'Map' });

    for (const options of [
      { modifiers: ['ControlOrMeta' as const] },
      { button: 'middle' as const },
    ]) {
      const opened = context.waitForEvent('page');

      await link.click(options);

      const tab = await opened;

      await tab.waitForLoadState();
      expect(new URL(tab.url()).pathname).toBe('/');
      await tab.close();
    }

    await expect(page).toHaveURL(url => url.pathname === '/people');
  });

  // PPL-01
  test('a slow server shows the loading screen', async ({ page }) => {
    const ended = prefetched(page, '/people');

    await page.goto('/');
    await mark(page);
    await expect
      .poll(ended, {
        message: 'The /people loading-boundary prefetch did not end',
        timeout: 10_000,
      })
      .toBe(true);
    await page.route(
      url => url.pathname === '/people',
      async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      }
    );
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: /^People/ }).click();

    await expect(page.getByText('Loading people')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
    await expect(page.getByText('Loading people')).toHaveCount(0);
    expect(await same(page)).toBe(true);
  });

  // MAP-03, NFR-01
  test('the Map date, layers and one map survive a visit to People', async ({
    page,
  }) => {
    await page.goto('/');
    await mark(page);
    await field(page).fill('1900');
    await field(page).press('Enter');
    await expect(field(page)).toHaveValue('1900');

    const first = layers(page).getByRole('checkbox').first();

    await first.uncheck();
    await openPeople(page);
    await page.getByRole('link', { name: 'Map' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/');

    await expect(field(page)).toHaveValue('1900');
    await expect(first).not.toBeChecked();
    await expect(page.locator('canvas.maplibregl-canvas')).toHaveCount(1);
    expect(await same(page)).toBe(true);

    const canvas = await page.locator('canvas.maplibregl-canvas').boundingBox();

    expect(canvas?.width).toBeCloseTo(1280, 0);
    expect(canvas?.height).toBeCloseTo(800, 0);
  });

  // PPL-01
  test('the map is hidden from the keyboard and screen readers on People', async ({
    page,
  }) => {
    await page.goto('/');
    await mark(page);
    await openPeople(page);

    await expect(page.getByRole('slider', { name: 'Map date' })).toHaveCount(0);

    for (let press = 0; press < 12; press += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(
          () => document.activeElement?.closest('[inert]') !== null
        )
      ).toBe(false);
    }
  });

  // NFR-01
  test('a direct load of People requests no basemap or boundary file', async ({
    page,
  }) => {
    const requests: string[] = [];

    page.on('request', request =>
      requests.push(new URL(request.url()).pathname)
    );
    await page.goto('/people');
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(
      requests.filter(
        path => path.includes('/data/') || path.startsWith('/map/')
      )
    ).toEqual([]);
    await expect(page.locator('canvas.maplibregl-canvas')).toHaveCount(0);
  });
});

test.describe('phone, 390 × 844', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  // NFR-05
  test('the map fills the window on return, with the date sheet kept', async ({
    page,
  }) => {
    await page.goto('/');
    await mark(page);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: /^People/ }).click();
    await expect(page).toHaveURL(url => url.pathname === '/people');
    await page.getByRole('link', { name: 'Map' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/');
    await expect(page.getByRole('region', { name: 'Map date' })).toBeVisible();

    const canvas = await page.locator('canvas.maplibregl-canvas').boundingBox();

    expect(canvas?.width).toBeCloseTo(390, 0);
    expect(canvas?.height).toBeCloseTo(844, 0);
    expect(await same(page)).toBe(true);
  });
});

test.describe('own session', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { height: 800, width: 1280 },
  });

  // NFR-03: sign-out loads a new document, so this proves the result a user sees. `MapHost.test.tsx`
  // proves that `MapHost` drops the map off its routes.
  test('after sign-out and sign-in the map starts at today with every layer on', async ({
    page,
  }) => {
    // This test starts the map twice. It takes up to 25 s on a CI runner, against a 30 s limit.
    test.slow();

    const signIn = async () => {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(SYNTHETIC.email);
      await page
        .getByLabel('Password', { exact: true })
        .fill(SYNTHETIC.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL(url => url.pathname === '/');
    };

    await signIn();
    await field(page).fill('1900');
    await field(page).press('Enter');
    await layers(page).getByRole('checkbox').first().uncheck();
    await openPeople(page);
    await signOut(page);
    await signIn();

    await expect(field(page)).toHaveValue(String(new Date().getFullYear()));

    for (const box of await layers(page).getByRole('checkbox').all()) {
      await expect(box).toBeChecked();
    }
  });
});
