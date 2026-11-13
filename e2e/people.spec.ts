import { expect, test } from '@playwright/test';

// PPL-01, NFR-09
test('the People page is never cached', async ({ page }) => {
  const response = await page.goto('/people');

  expect(response?.headers()['cache-control']).toBe('private, no-store');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
});

// PPL-01
test('the hidden Born and Died labels stay inside their row', async ({
  page,
}) => {
  await page.goto('/screens/people-list');

  const rows = page
    .getByRole('region', { name: 'People, by surname' })
    .getByRole('link');

  expect(await rows.count()).toBe(12);

  const outside = await rows.evaluateAll(links =>
    links.flatMap(link => {
      const row = link.getBoundingClientRect();

      return [...link.querySelectorAll('span')]
        .filter(span => ['Born', 'Died'].includes(span.textContent.trim()))
        .map(span => span.getBoundingClientRect())
        .filter(
          box =>
            box.top < row.top ||
            box.bottom > row.bottom ||
            box.left < row.left ||
            box.right > row.right
        ).length;
    })
  );

  expect(outside.every(count => count === 0)).toBe(true);
});
