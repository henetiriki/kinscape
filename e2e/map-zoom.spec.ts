import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

import { centreOf } from '@ks/e2e/view';
import { FIRST_VIEW } from '@ks/lib/domain/map/view.mts';

// MAP-01: the zoom card in the map's `zoom` slot.

const zoomIn = (page: Page) => page.getByRole('button', { name: 'Zoom in' });
const zoomOut = (page: Page) => page.getByRole('button', { name: 'Zoom out' });
const fit = (page: Page) =>
  page.getByRole('button', { name: 'Fit South Africa' });
const zoomOf = (page: Page) =>
  page.evaluate(() => (window as unknown as TestWindow).kinscapeMap.getZoom());
// Where the middle of the first view sits on screen.
const viewOf = (page: Page) =>
  page.evaluate((centre: [number, number]) => {
    const { kinscapeMap } = window as unknown as TestWindow;
    const { x, y } = kinscapeMap.project(centre);

    return {
      padding: kinscapeMap.getPadding(),
      x,
      y,
      zoom: kinscapeMap.getZoom(),
    };
  }, centreOf(FIRST_VIEW));
const settled = async (page: Page) => {
  await page.waitForFunction(() => {
    const { kinscapeMap } = window as unknown as {
      kinscapeMap?: { isMoving: () => boolean };
    };

    return kinscapeMap !== undefined && !kinscapeMap.isMoving();
  });
};

test.describe('on a desktop, 1440 × 900', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  test('the zoom slot shows the three buttons and no MapLibre button shows', async ({
    page,
  }) => {
    await page.goto('/');

    const slot = page.locator('[data-slot="zoom"]');

    await expect(slot.getByRole('button')).toHaveText(['', '', '']);
    await expect(zoomIn(page)).toBeVisible();
    await expect(zoomOut(page)).toBeVisible();
    await expect(fit(page)).toBeVisible();
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toHaveCount(0);
    await expect(page.locator('.maplibregl-ctrl-top-right')).not.toContainText(
      'Zoom'
    );
  });

  test('the card lines up with the Avatar and starts at the furniture top', async ({
    page,
  }) => {
    await page.goto('/');

    const card = page.locator('[data-slot="zoom"]');
    const avatar = page.getByRole('button', { name: 'Account menu' });

    await expect(card).toBeVisible();

    const cardBox = (await card.boundingBox())!;
    const avatarBox = (await avatar.boundingBox())!;
    const top = await page.evaluate(() => {
      const probe = document.createElement('div');

      probe.style.cssText =
        'position:fixed;top:var(--layout-furniture-top);height:0';
      document.body.append(probe);

      const { top } = probe.getBoundingClientRect();

      probe.remove();

      return top;
    });

    expect(cardBox.x + cardBox.width).toBeCloseTo(
      avatarBox.x + avatarBox.width,
      0
    );
    expect(cardBox.y).toBeCloseTo(top, 0);
    expect(cardBox.y).toBeGreaterThanOrEqual(avatarBox.y + avatarBox.height);
  });

  test('Zoom in and Zoom out change the zoom by one level', async ({
    page,
  }) => {
    await page.goto('/');
    await settled(page);

    const start = await zoomOf(page);

    await zoomIn(page).click();
    await expect.poll(() => zoomOf(page)).toBeCloseTo(start + 1, 1);
    await zoomOut(page).click();
    await expect.poll(() => zoomOf(page)).toBeCloseTo(start, 1);
  });

  test('Zoom out is aria-disabled at the minimum, stays in the Tab order and does nothing', async ({
    page,
  }) => {
    await page.goto('/');
    await settled(page);
    await page.evaluate(() => {
      const { kinscapeMap } = window as unknown as TestWindow;

      kinscapeMap.jumpTo({ zoom: kinscapeMap.getMinZoom() });
    });
    await expect(zoomOut(page)).toHaveAttribute('aria-disabled', 'true');

    const before = await zoomOf(page);

    // Playwright skips a click on an aria-disabled button, so force it.
    await zoomOut(page).click({ force: true });
    expect(await zoomOf(page)).toBeCloseTo(before, 3);
    await zoomIn(page).focus();
    await page.keyboard.press('Tab');
    await expect(zoomOut(page)).toBeFocused();
  });

  test('Zoom in is aria-disabled at the maximum and does nothing', async ({
    page,
  }) => {
    await page.goto('/');
    await settled(page);
    await page.evaluate(() => {
      const { kinscapeMap } = window as unknown as TestWindow;

      kinscapeMap.jumpTo({ zoom: kinscapeMap.getMaxZoom() });
    });
    await expect(zoomIn(page)).toHaveAttribute('aria-disabled', 'true');

    const before = await zoomOf(page);

    await zoomIn(page).click({ force: true });
    expect(await zoomOf(page)).toBeCloseTo(before, 3);
  });

  test('Fit South Africa returns to the first view', async ({ page }) => {
    await page.goto('/');
    await settled(page);

    const first = await viewOf(page);

    await zoomIn(page).click();
    await zoomIn(page).click();
    await page.mouse.move(700, 450);
    await page.mouse.down();
    await page.mouse.move(800, 500, { steps: 5 });
    await page.mouse.up();
    await fit(page).click();
    await settled(page);

    const second = await viewOf(page);

    expect(second.zoom).toBeCloseTo(first.zoom, 1);
    // The middle of the first view sits in the middle of the free area.
    expect(second.x).toBeCloseTo(
      second.padding.left +
        (1440 - second.padding.left - second.padding.right) / 2,
      -1
    );
    expect(second.y).toBeCloseTo(
      second.padding.top +
        (900 - second.padding.top - second.padding.bottom) / 2,
      -1
    );
  });

  test('no ancestor of a zoom button clips its focus ring', async ({
    page,
  }) => {
    await page.goto('/');
    await settled(page);

    await zoomIn(page).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(zoomIn(page)).toBeFocused();

    const result = await zoomIn(page).evaluate(node => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const reach =
        parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
      const ring = {
        bottom: box.bottom + reach,
        left: box.left - reach,
        right: box.right + reach,
        top: box.top - reach,
      };
      const tolerance = 0.5;
      const cut: string[] = [];

      for (
        let parent = node.parentElement;
        parent && parent !== document.body;
        parent = parent.parentElement
      ) {
        const { overflowX, overflowY } = getComputedStyle(parent);

        if (overflowX === 'visible' && overflowY === 'visible') continue;

        const outer = parent.getBoundingClientRect();
        const left = outer.left + parent.clientLeft;
        const top = outer.top + parent.clientTop;

        if (
          ring.left < left - tolerance ||
          ring.top < top - tolerance ||
          ring.right > left + parent.clientWidth + tolerance ||
          ring.bottom > top + parent.clientHeight + tolerance
        ) {
          cut.push(parent.className);
        }
      }

      return [cut, style.outlineWidth];
    });

    expect(result).toEqual([[], '2px']);
  });

  test('the open account menu paints above the zoom card', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Account menu' }).click();

    const menu = page.getByRole('menu', { name: 'Account' });

    await expect(menu).toBeVisible();

    // The menu role wraps the items, not the header, so probe 8px below the top of the first item.
    const cardBox = (await page.locator('[data-slot="zoom"]').boundingBox())!;
    const menuBox = (await menu.boundingBox())!;
    const point = { x: cardBox.x + cardBox.width / 2, y: menuBox.y + 8 };

    // The point must be over the card, or the check cannot fail.
    expect(point.y).toBeGreaterThan(cardBox.y);
    expect(point.y).toBeLessThan(cardBox.y + cardBox.height);

    const hit = await menu.evaluate(
      (node, { x, y }) => node.contains(document.elementFromPoint(x, y)),
      point
    );

    expect(hit).toBe(true);
  });
});
