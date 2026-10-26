import type { Locator, Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// NFR-05: the shared controls on a phone.

const live = (page: Page) =>
  page.getByRole('figure', { name: 'State matrix' }).locator(':not([inert] *)');

// The point 21px from a control's centre is still on the control: a 44px hit area.
const hitsControl = async (control: Locator, dx: number, dy: number) => {
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;

  return control.evaluate(
    (node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);

      return hit !== null && (node === hit || node.contains(hit));
    },
    { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
  );
};

test.describe('on a phone', () => {
  // The toast's rise would shift its box while it is measured.
  test.use({ reducedMotion: 'reduce', viewport: { height: 844, width: 390 } });

  const fontSize = (field: Locator) =>
    field.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize));

  test('a focused text field and date field have text of at least 16px', async ({
    page,
  }) => {
    await page.goto('/design-kit/feedback');

    for (const field of [
      page.getByRole('textbox', { name: 'Email' }).first(),
      page.getByRole('textbox', { name: 'Date shown' }).first(),
    ]) {
      await field.focus();
      expect(await fontSize(field)).toBeGreaterThanOrEqual(16);
    }
  });

  test('the date callout sits above the field, inside the gutters, with its pointer on the field', async ({
    page,
  }) => {
    await page.goto('/design-kit/feedback');

    const callout = page.getByRole('alert').filter({ hasText: 'still shows' });
    // On a phone the date sheet stands in for the dock.
    const field = page
      .locator('div[class*="sheet"]')
      .getByRole('textbox', { name: 'Date shown' });
    const pointer = page.locator('div[class*="sheet"] span[class*="pointer"]');

    await callout.scrollIntoViewIfNeeded();

    const box = (await callout.boundingBox())!;
    const target = (await field.boundingBox())!;
    const point = (await pointer.boundingBox())!;

    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(374);
    expect(box.y + box.height).toBeLessThan(target.y);
    expect(point.x + point.width / 2).toBeCloseTo(
      target.x + target.width / 2,
      0
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('a checkbox, chip, segment, tab and icon button each have a 44 x 44px hit area', async ({
    page,
  }) => {
    await page.goto('/design-kit/states');

    const controls = [
      live(page).getByRole('checkbox', { name: 'Checkbox off' }).first(),
      live(page).getByRole('button', { name: 'Birth' }).first(),
      live(page).locator('label', { hasText: 'Month' }).first(),
      live(page).getByRole('tab', { name: 'Filters' }).first(),
      live(page).getByRole('button', { name: 'Zoom in' }).first(),
    ];

    for (const control of controls) {
      expect(await hitsControl(control, 0, 21)).toBe(true);
      expect(await hitsControl(control, 0, -21)).toBe(true);
    }

    expect(await hitsControl(controls[0], -21, 0)).toBe(true);
  });

  test('a placed banner is 80px from the top and a placed toast 164px from the bottom, inside the gutters', async ({
    page,
  }) => {
    await page.goto('/design-kit/feedback');

    const banner = page.locator('[role="alert"][class*="banner"]');
    const toast = page.locator('[role="status"][class*="toast"]').first();

    await page.evaluate(() => {
      for (const node of document.querySelectorAll(
        '[role="status"][class*="toast"], [role="alert"][class*="banner"]'
      ))
        node.setAttribute('data-placed', '');
    });

    const top = (await banner.boundingBox())!;
    const bottom = (await toast.boundingBox())!;

    expect(top.y).toBe(80);
    expect(844 - (bottom.y + bottom.height)).toBe(164);

    for (const box of [top, bottom]) {
      expect(box.x).toBe(16);
      expect(box.x + box.width).toBe(374);
    }
  });
});

test.describe('hover', () => {
  const background = (button: Locator) =>
    button.evaluate(node => getComputedStyle(node).backgroundColor);

  const copyChain = (page: Page) =>
    live(page).getByRole('button', { name: 'Copy chain' }).first();

  test.describe('on a touch screen', () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { height: 844, width: 390 },
    });

    test('a tap leaves the background unchanged', async ({ page }) => {
      await page.goto('/design-kit/states');
      expect(
        await page.evaluate(() => matchMedia('(hover: hover)').matches)
      ).toBe(false);

      const button = copyChain(page);

      await button.scrollIntoViewIfNeeded();

      const rest = await background(button);
      const box = (await button.boundingBox())!;

      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      // The press colour fades back over the button's transition.
      await expect.poll(() => background(button)).toBe(rest);
    });
  });

  test('a mouse over a button tints it', async ({ page }) => {
    await page.goto('/design-kit/states');

    const button = copyChain(page);

    await button.scrollIntoViewIfNeeded();

    const rest = await background(button);

    await button.hover();
    // The tint fades in over the button's transition.
    await expect.poll(() => background(button)).not.toBe(rest);
  });
});
