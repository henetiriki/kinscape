import { expect, test } from '@playwright/test';

// NFR-05, NFR-06: board 07, the surfaces components.

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('notice cards fill the width less the gutters, with 44px buttons, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces');

    const first = page
      .getByRole('status')
      .filter({ hasText: 'No pins in 1901' })
      .first();
    const box = (await first.boundingBox())!;

    expect(Math.round(box.width)).toBeLessThanOrEqual(390 - 32);
    expect(
      Math.round(
        (await first.getByRole('button').first().boundingBox())!.height
      )
    ).toBe(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('part 2 shows the callout alone', async ({ page }) => {
    await page.goto('/design-kit/surfaces?part=2');

    await expect(page.getByRole('region', { name: 'Callout' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Surface' })).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
