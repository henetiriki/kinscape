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
  test('the People page is a look-up, with the note and no add or edit control', async ({
    page,
  }) => {
    await page.goto('/screens/people-list');
    await expect(
      page.getByText('To add or edit people, use a computer.')
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add a person' })).toHaveCount(
      0
    );
    await expect(page.getByText('Edit', { exact: true })).toHaveCount(0);
  });

  // NFR-05
  test('/people/new shows the notice and a link back to the list', async ({
    page,
  }) => {
    await page.goto('/people/new');
    await expect(page.getByRole('form')).toHaveCount(0);
    await expect(page.getByText('Edit people on a computer')).toBeVisible();
    await page.getByRole('link', { name: 'See all people' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/people');
  });
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

  const found = await rows.evaluateAll(links =>
    links.map(link => {
      const row = link.getBoundingClientRect();
      const labels = [...link.querySelectorAll('span')]
        .filter(span => ['Born', 'Died'].includes(span.textContent.trim()))
        .map(span => span.getBoundingClientRect());

      return {
        labels: labels.length,
        outside: labels.filter(
          box =>
            box.top < row.top ||
            box.bottom > row.bottom ||
            box.left < row.left ||
            box.right > row.right
        ).length,
      };
    })
  );

  // Two labels in each of the 12 rows: a count of 0 would pass the check below for nothing.
  expect(found.reduce((total, { labels }) => total + labels, 0)).toBe(24);
  expect(found.reduce((total, { outside }) => total + outside, 0)).toBe(0);
});
