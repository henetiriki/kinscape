import { expect, test } from '@playwright/test';

const COOKIE = '__Host-kinscape-session';

// NFR-03
test('a GET to any path leaves the session signed in', async ({ page }) => {
  const sent: boolean[] = [];

  page.on('request', request => {
    if (
      request.resourceType() === 'fetch' &&
      new URL(request.url()).origin === new URL(page.url()).origin
    ) {
      void request
        .allHeaders()
        .then(headers => sent.push((headers.cookie ?? '').includes(COOKIE)));
    }
  });

  await page.goto('/');

  const paths = [
    '/sign-in',
    '/sign-out',
    '/logout',
    '/data/polities',
    '/?signOut=1',
  ];

  for (const path of paths) {
    await page.evaluate(p => fetch(p, { credentials: 'include' }), path);
  }

  await expect.poll(() => sent.length).toBeGreaterThanOrEqual(paths.length);
  expect(sent.every(Boolean)).toBe(true);

  await page.goto('/');

  await expect(page).toHaveURL(url => url.pathname === '/');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
});
