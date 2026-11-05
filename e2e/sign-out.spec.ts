import type { Request } from '@playwright/test';

import { expect, test } from '@playwright/test';

const COOKIE = '__Host-kinscape-session';

// NFR-03
test('a GET to any path leaves the session signed in', async ({ page }) => {
  const requests: Request[] = [];

  page.on('request', request => {
    if (
      request.resourceType() === 'fetch' &&
      new URL(request.url()).origin === new URL(page.url()).origin
    ) {
      requests.push(request);
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

  expect(requests.length).toBeGreaterThanOrEqual(paths.length);
  const sent = await Promise.all(
    requests.map(async request =>
      ((await request.allHeaders()).cookie ?? '').includes(COOKIE)
    )
  );

  expect(sent.every(Boolean)).toBe(true);

  await page.goto('/');

  await expect(page).toHaveURL(url => url.pathname === '/');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
});
