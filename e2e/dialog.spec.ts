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

    await dialog.locator('ul').evaluate(node => node.scrollIntoView(false));
    await dialog.evaluate(node => {
      node.querySelector('li:last-child')?.scrollIntoView();
    });
    await expect(
      dialog.getByRole('button', { name: 'Close' })
    ).toBeInViewport();
  });
});
