import type { BrowserContext } from '@playwright/test';

import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { sep } from 'node:path';

import { appRoutes, PUBLIC_PATHS } from '#ks/scripts/safety.mts';

const SESSION_COOKIE = '__Host-kinscape-session';

// Every test here starts signed out.
test.use({ storageState: { cookies: [], origins: [] } });

// A well-formed token no session has: it passes the proxy's cookie check and fails the full one.
const forge = async (context: BrowserContext) =>
  context.addCookies([
    {
      domain: 'localhost',
      httpOnly: true,
      name: SESSION_COOKIE,
      path: '/',
      sameSite: 'Lax',
      secure: true,
      value: 'x'.repeat(43),
    },
  ]);

/** Every route the app serves, from the files under app/ (scripts/__tests__/gate.test.ts checks the same list). */
const ROUTES = appRoutes(
  readdirSync('app', { recursive: true }).map(name =>
    `app/${String(name)}`.split(sep).join('/')
  )
);

// NFR-03
for (const path of ['/', '/design-kit', '/screens/add-pin']) {
  test(`signed out, ${path} shows only the sign-in page`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(url => url.pathname === '/sign-in');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(path);
  });
}

// NFR-03
test('a forged session cookie shows the sign-in page, not the map', async ({
  context,
  page,
}) => {
  await forge(context);
  await page.goto('/');

  await expect(page).toHaveURL(url => url.pathname === '/sign-in');
  await expect(page.locator('canvas.maplibregl-canvas')).toHaveCount(0);
});

// NFR-03, NFR-10: every route, with no cookie and with a forged one, is public or turns the
// request away: a redirect to the sign-in page, or 401 under /data/.
for (const { file, path } of ROUTES) {
  const isPublic = PUBLIC_PATHS.includes(path);

  test(`${path} (${file}) is ${isPublic ? 'public' : 'gated'} without a session and with a forged one`, async ({
    context,
    page,
  }) => {
    const check = async () => {
      const response = await page.request.get(path, { maxRedirects: 0 });

      if (isPublic) {
        expect(response.status()).toBe(200);
      } else if (response.status() === 401) {
        expect(await response.text()).toBe('');
      } else {
        expect(response.status()).toBe(307);
        expect(
          new URL(response.headers().location, 'http://localhost').pathname
        ).toBe('/sign-in');
      }
    };

    await check();
    await forge(context);
    await check();
  });
}

// NFR-03
test('every response says noindex: a 401, a redirect, the sign-in page and a public file', async ({
  page,
}) => {
  const urls = [
    ['/data/polities', 401],
    ['/', 307],
    ['/sign-in', 200],
    ['/map/land.geojson', 200],
  ] as const;

  for (const [path, status] of urls) {
    const response = await page.request.get(path, { maxRedirects: 0 });

    expect(response.status(), path).toBe(status);
    expect(response.headers()['x-robots-tag'], path).toBe('noindex');
  }
});
