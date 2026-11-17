import { expect, test } from '@playwright/test';

// NFR-05, NFR-06: board 07, the Menu, Avatar and Popup.

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('part 2 shows the sheet Popup alone, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces?part=2');

    await expect(
      page.getByRole('region', { name: 'On this spot in 1901' })
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Copy chain' })).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
