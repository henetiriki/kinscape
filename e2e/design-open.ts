import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

/** Opens the route of a screen at `size` and waits until the network, the fonts and the map are idle. */
export const openScreen = async (
  page: Page,
  screen: { name: string; route: string },
  size: { height: number; width: number }
) => {
  // A signed-in visitor never sees the sign-in page.
  if (screen.route.startsWith('/sign-in')) {
    await page.context().clearCookies();
  }

  await page.setViewportSize(size);

  const response = await page.goto(screen.route);

  expect(response?.status(), `${screen.name}: ${screen.route} status`).toBe(
    200
  );
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;

    const map = (window as unknown as { kinscapeMap?: { loaded(): boolean } })
      .kinscapeMap;

    while (map && !map.loaded()) {
      await new Promise(done => setTimeout(done, 100));
    }
  });
};
