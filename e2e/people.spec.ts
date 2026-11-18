import { expect, test } from '@playwright/test';

// PPL-01, NFR-09
test('the People page is never cached', async ({ page }) => {
  const response = await page.goto('/people');

  expect(response?.headers()['cache-control']).toBe('private, no-store');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
});

test.describe('phone, 390 × 844', () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

  // NFR-05
  test('/people/new shows the notice and a link back to the list', async ({
    page,
  }) => {
    await page.goto('/people/new');
    await expect(page.getByRole('form')).toHaveCount(0);
    await expect(page.getByText('Edit people on a computer')).toBeVisible();
    await expect(page.getByText('Relationships')).toHaveCount(0);
    await page.getByRole('link', { name: 'See all people' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/people');
  });

  // NFR-05, NFR-06
  test('the notice card fits the width, its link is 44px tall, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/people/new');

    const card = page
      .getByRole('status')
      .filter({ hasText: 'Edit people on a computer' });
    const box = (await card.boundingBox())!;

    expect(Math.round(box.width)).toBeLessThanOrEqual(390 - 32);
    expect(
      Math.round(
        (await card
          .getByRole('link', { name: 'See all people' })
          .boundingBox())!.height
      )
    ).toBe(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  // NFR-05
  test('/people/{id} shows the notice and no Relationships link', async ({
    page,
  }) => {
    await page.goto('/screens/person-edit');
    await expect(page.getByText('Edit people on a computer')).toBeVisible();
    await expect(page.getByText('Relationships')).toHaveCount(0);
  });
});
