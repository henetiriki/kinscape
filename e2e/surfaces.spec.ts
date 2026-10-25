import { expect, type Page, test } from '@playwright/test';

// NFR-05, NFR-06: board 07, the surfaces components.

const card = (page: Page, name: string) =>
  page.getByRole('status').filter({ hasText: name }).first();

test.describe('on a desktop', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  test('a notice card has 40px buttons and is 360 wide, 380 when large', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces');

    const first = card(page, 'No pins in 1901');

    expect(
      Math.round(
        (await first.getByRole('button').first().boundingBox())!.height
      )
    ).toBe(40);
    expect(Math.round((await first.boundingBox())!.width)).toBe(360);
    expect(
      Math.round((await card(page, 'No pins yet').boundingBox())!.width)
    ).toBe(380);
  });

  test('Tab goes from before the card to its button, never onto the card', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces');

    const first = card(page, 'No pins in 1901');
    const jump = first.getByRole('button', { name: 'Jump to 1898' });

    await jump.evaluate(node => {
      const before = document.createElement('button');

      before.id = 'before-card';
      node.closest('[role=status]')!.before(before);
    });
    await page.locator('#before-card').focus();
    await page.keyboard.press('Tab');
    await expect(jump).toBeFocused();
  });

  test('the progress bar fill eases, unless motion is reduced', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces');

    const fill = page.getByRole('progressbar').first().locator('span');

    expect(
      await fill.evaluate(node => getComputedStyle(node).transitionDuration)
    ).toBe('0.16s');
  });

  test('the date callout shows board 07 padding and floating shadow', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces?part=2');

    const callout = page.getByRole('alert').first();
    const style = await callout.evaluate(node => {
      const { boxShadow, padding } = getComputedStyle(node);

      return { boxShadow, padding };
    });

    expect(style.padding).toBe('12px');
    expect(style.boxShadow).toContain('30px');
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the progress bar fill does not ease', async ({ page }) => {
    await page.goto('/design-kit/surfaces');

    const fill = page.getByRole('progressbar').first().locator('span');

    expect(
      await fill.evaluate(node => getComputedStyle(node).transitionDuration)
    ).toBe('0s');
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('notice cards fill the width less the gutters, with 44px buttons, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/design-kit/surfaces');

    const first = card(page, 'No pins in 1901');
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
