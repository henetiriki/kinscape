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
    await expect(page.getByText('Relationships')).toHaveCount(0);
  });

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

// PPL-01
test('the hidden words for the dates stay inside their row', async ({
  page,
}) => {
  await page.goto('/screens/people-list');

  const rows = page
    .getByRole('region', { name: 'People, by surname' })
    .getByRole('link')
    .filter({ hasNotText: 'Relationships' });

  expect(await rows.count()).toBe(12);

  const found = await rows.evaluateAll(links =>
    links.map(link => {
      const row = link.getBoundingClientRect();
      const labels = [...link.querySelectorAll('span')]
        .filter(
          span =>
            span.className.includes('hidden') && /^Born /.test(span.textContent)
        )
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

  // One text in each of the 12 rows: a count of 0 would pass the check below for nothing.
  expect(found.reduce((total, { labels }) => total + labels, 0)).toBe(12);
  expect(found.reduce((total, { outside }) => total + outside, 0)).toBe(0);
});
