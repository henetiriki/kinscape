import { expect, test } from '@playwright/test';

// NFR-05, NFR-06, EXP-04, MAP-05: board 08, the map furniture.

const ROUTE = '/design-kit/map-furniture';

test.describe('on a desktop', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  test('the Wordmark icons are 44, 36 and 32 square, with a quarter radius', async ({
    page,
  }) => {
    await page.goto(ROUTE);

    const icons = page
      .getByRole('region', { name: 'Wordmark' })
      .locator('img')
      .evaluateAll(nodes =>
        nodes.map(node => [
          node.getBoundingClientRect().width,
          getComputedStyle(node).borderTopLeftRadius,
        ])
      );

    expect(await icons).toEqual([
      [44, '11px'],
      [36, '9px'],
      [32, '8px'],
      [32, '8px'],
    ]);
  });

  test('"/" focuses the bar from the page; Esc clears, then leaves', async ({
    page,
  }) => {
    await page.goto(ROUTE);

    const field = page.getByRole('searchbox', {
      name: 'Search people and places',
    });
    const first = field.first();

    // The "/" listener is added after hydration, so a press right after load can be lost: press again until it lands.
    await expect(async () => {
      await page.keyboard.press('/');
      await expect(first).toBeFocused({ timeout: 500 });
    }).toPass();

    await page.keyboard.type('Kimberley');
    await page.keyboard.press('Escape');
    await expect(first).toBeFocused();
    await expect(first).toHaveValue('');

    await page.keyboard.press('Escape');
    await expect(first).not.toBeFocused();
  });

  test('Zoom out at its minimum is aria-disabled but Tab still reaches it', async ({
    page,
  }) => {
    await page.goto(ROUTE);

    const controls = page.getByRole('region', { name: 'Map controls' });
    const zoomOut = controls.getByRole('button', { name: 'Zoom out' }).first();

    await zoomOut.click();
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    await controls.getByRole('button', { name: 'Zoom in' }).first().focus();
    await page.keyboard.press('Tab');
    await expect(zoomOut).toBeFocused();
  });

  test('no ancestor of a zoom button clips its focus ring', async ({
    page,
  }) => {
    await page.goto(ROUTE);

    const button = page
      .getByRole('region', { name: 'Map controls' })
      .getByRole('button', { name: 'Zoom in' })
      .first();

    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();

    const clipped = await button.evaluate(node => {
      const found: string[] = [];

      for (
        let parent = node.parentElement;
        parent && parent !== document.body;
        parent = parent.parentElement
      ) {
        const { overflowX, overflowY } = getComputedStyle(parent);

        if (overflowX !== 'visible' || overflowY !== 'visible') {
          found.push(parent.className);
        }
      }

      return [found, getComputedStyle(node).outlineWidth];
    });

    // The card and the sample around it clip nothing; the outline is the 2px ring.
    expect(clipped).toEqual([[], '2px']);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('the pill and layers button are at least 44px, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto(ROUTE);

    for (const target of [
      page.getByRole('searchbox').first(),
      page.getByRole('button', { name: 'Layers and filters' }).first(),
    ]) {
      const box = (await target.boundingBox())!;

      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('part 2 holds the glyphs, legend and Date dock, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto(`${ROUTE}?part=2`);

    await expect(page.getByRole('region', { name: 'Date dock' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Wordmark' })).toBeHidden();
    await expect(
      page.getByRole('link', { name: /^Part 1: wordmark/ })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
