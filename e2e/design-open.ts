import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

/** The screens that `DESIGN_SCREENS` names, or all of them. An unknown name throws. */
export const wantedScreens = <T extends { name: string }>(screens: T[]) => {
  const wanted = process.env.DESIGN_SCREENS?.split(',').filter(Boolean) ?? [];
  const unknown = wanted.filter(
    name => !screens.some(screen => screen.name === name)
  );

  if (unknown.length > 0) {
    throw new Error(`DESIGN_SCREENS names no screen: ${unknown.join(', ')}`);
  }

  return screens.filter(
    ({ name }) => wanted.length === 0 || wanted.includes(name)
  );
};

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
