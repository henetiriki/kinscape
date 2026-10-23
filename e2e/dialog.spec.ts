import { expect, type Page, test } from '@playwright/test';

// NFR-05, NFR-06, NFR-08: the Sources dialog on board 07's Dialog.

const open = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Attributions' }).click();

  const dialog = page.getByRole('dialog', { name: 'Sources and attributions' });

  await expect(dialog).toBeVisible();
  // The sheet form has slid in once its animation is done.
  await dialog.evaluate(node =>
    Promise.all(node.getAnimations().map(animation => animation.finished))
  );

  return dialog;
};

test.describe('on a desktop', () => {
  test.use({ viewport: { height: 900, width: 1280 } });

  test('is a centred modal, 760 wide, with Close focused; Esc closes and returns focus', async ({
    page,
  }) => {
    const dialog = await open(page);
    const panel = dialog.locator('[data-form]');
    const box = (await panel.boundingBox())!;

    await expect(panel).toHaveAttribute('data-form', 'centred');
    expect(Math.round(box.width)).toBe(760);
    expect(Math.abs(box.x + box.width / 2 - 640)).toBeLessThan(2);
    expect(await dialog.evaluate(node => node.matches(':modal'))).toBe(true);
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await expect(dialog.getByRole('table')).toBeVisible();
    await expect(dialog.getByRole('list')).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Attributions' })
    ).toBeFocused();
  });

  test('licence links are small Links; the head stays while the body scrolls', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 600, width: 1280 });

    const dialog = await open(page);
    const link = dialog.getByRole('table').getByRole('link').first();
    const style = await link.evaluate(node => {
      const { fontSize, fontWeight, lineHeight, textDecorationLine } =
        getComputedStyle(node);

      return { fontSize, fontWeight, lineHeight, textDecorationLine };
    });

    expect(style).toEqual({
      fontSize: '13px',
      fontWeight: '500',
      lineHeight: '20px',
      textDecorationLine: 'underline',
    });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer');

    const title = dialog.getByRole('heading', {
      name: 'Sources and attributions',
    });
    const before = (await title.boundingBox())!;

    await dialog
      .getByRole('table')
      .getByRole('row')
      .last()
      .scrollIntoViewIfNeeded();
    expect((await title.boundingBox())!.y).toBe(before.y);
    expect(
      await dialog
        .locator('[data-form] > :last-child')
        .evaluate(node => node.scrollTop)
    ).toBeGreaterThan(0);
  });

  test('a click on the scrim closes it', async ({ page }) => {
    const dialog = await open(page);

    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('is a bottom sheet with a list, and Close stays in view after scrolling', async ({
    page,
  }) => {
    const dialog = await open(page);
    const panel = dialog.locator('[data-form]');
    const box = (await panel.boundingBox())!;

    await expect(panel).toHaveAttribute('data-form', 'sheet');
    expect(Math.round(box.y + box.height)).toBe(844);
    expect(Math.round(box.width)).toBe(390);
    await expect(dialog.getByRole('list')).toBeVisible();
    await expect(dialog.getByRole('table')).toBeHidden();
    await expect(dialog.locator('[data-form] > span').first()).toBeVisible();
    // Each item reads layer, then source, licence and date, then detail.
    const item = dialog.getByRole('listitem').first();

    await expect(item.locator('> *')).toHaveCount(3);
    await expect(item.locator('> *').nth(1).getByRole('link')).toBeVisible();

    await dialog.locator('ul').evaluate(node => node.scrollIntoView(false));
    await dialog.evaluate(node => {
      node.querySelector('li:last-child')?.scrollIntoView();
    });
    await expect(
      dialog.getByRole('button', { name: 'Close' })
    ).toBeInViewport();
  });
});
