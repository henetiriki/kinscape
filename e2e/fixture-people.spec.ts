import { expect, test } from '@playwright/test';

import { wideAt } from '@ks/e2e/sideways';
import { fixtureStateFor } from '@ks/lib/design/check.mts';
import { FIXTURES, MARIA } from '@ks/server/auth/fixtures.mts';

const [researcher, family] = FIXTURES;

test.describe('the family Tree', () => {
  test.use({ storageState: fixtureStateFor(family.email) });

  test.describe('phone, 390 × 844', () => {
    test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

    // NFR-05
    test('the People page is a look-up, with the note and no add or edit control', async ({
      page,
    }) => {
      await page.goto('/people');
      await expect(
        page.getByText('To add or edit people, use a computer.')
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Add a person' })
      ).toHaveCount(0);
      await expect(page.getByText('Edit', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Relationships')).toHaveCount(0);
    });

    // NFR-05
    test('/people/{id} shows the notice and no Relationships link', async ({
      page,
    }) => {
      await page.goto(`/people/${MARIA.id}`);
      await expect(page.getByText('Edit people on a computer')).toBeVisible();
      await expect(page.getByText('Relationships')).toHaveCount(0);
    });
  });

  // PPL-01
  test('the hidden words for the dates stay inside their row', async ({
    page,
  }) => {
    await page.goto('/people');

    const rows = page
      .getByRole('region', { name: 'People, by surname' })
      .getByRole('link')
      .filter({ hasNotText: 'Relationships' });

    expect(await rows.count()).toBe(13);

    const found = await rows.evaluateAll(links =>
      links.map(link => {
        const row = link.getBoundingClientRect();
        const labels = [...link.querySelectorAll('span')]
          .filter(
            span =>
              span.className.includes('hidden') &&
              /^Born /.test(span.textContent)
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

    // One text in each of the 13 rows: a count of 0 would pass the check below for nothing.
    expect(found.reduce((total, { labels }) => total + labels, 0)).toBe(13);
    expect(found.reduce((total, { outside }) => total + outside, 0)).toBe(0);
  });

  // NFR-05
  test('13 rows do not scroll sideways at any size', async ({ page }) => {
    expect(await wideAt(page, '/people')).toEqual([]);
  });

  // NFR-05
  test('the edit and Relationships pages do not scroll sideways at any size', async ({
    page,
  }) => {
    expect(await wideAt(page, `/people/${MARIA.id}`)).toEqual([]);
    expect(await wideAt(page, `/people/${MARIA.id}/relationships`)).toEqual([]);
  });
});

test.describe('the researcher Tree, on a phone', () => {
  test.use({
    storageState: fixtureStateFor(researcher.email),
    viewport: { height: 844, width: 375 },
  });

  // NFR-05
  test('the "No people yet" card sits between 16px gutters', async ({
    page,
  }) => {
    await page.goto('/people');

    const box = await page
      .getByRole('status')
      .filter({ hasText: 'No people yet' })
      .boundingBox();

    expect(box!.x).toBeCloseTo(16, 0);
    expect(375 - box!.x - box!.width).toBeCloseTo(16, 0);
  });
});
