import { expect, test } from '@playwright/test';

// NFR-03
test('a GET to any path leaves the session signed in', async ({ page }) => {
  for (const path of [
    '/sign-in',
    '/sign-out',
    '/logout',
    '/data/polities',
    '/?signOut=1',
  ]) {
    await page.request.get(path);
  }

  await page.goto('/');

  await expect(page).toHaveURL(url => url.pathname === '/');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
});
