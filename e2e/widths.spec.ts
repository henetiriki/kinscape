import { expect, test } from '@playwright/test';

import screens from '@ks/design/screens.json';
import { wideAt } from '@ks/e2e/sideways';

// NFR-05: no screen scrolls sideways at a phone, tablet or small desktop width.

// Its snapshot is a fixed 1440 wide board of one component.
const SKIPPED = new Set(['fuzzy-date-readings']);

const routes = [
  ...new Set(
    screens.screens
      .filter(({ name }) => !SKIPPED.has(name))
      .map(({ route }) => route)
  ),
];

for (const route of routes) {
  test(`${route} does not scroll sideways`, async ({ page }) => {
    // A signed-in visitor never sees the sign-in page.
    if (route.startsWith('/sign-in')) await page.context().clearCookies();

    const wide = await wideAt(page, route);

    expect(wide, `${route} scrolls sideways by`).toEqual([]);
  });
}
