import { expect, test } from '@playwright/test';

import screens from '@ks/design/screens.json';
import { states } from '@ks/e2e/design-states';
import { DESKTOP_SIZES, wideAt, wideNow } from '@ks/e2e/sideways';
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

    await expect(rows).toHaveCount(13);

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
    // A Person outside the Tree shows the not-found page, which `wideAt` also passes. A phone
    // size can show the notice, not the form: so check the pages at 1440 × 900 first.
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto(`/people/${MARIA.id}`);
    await expect(
      page.getByRole('heading', { name: 'Edit Maria Magdalena du Toit' })
    ).toBeVisible();
    await page.goto(`/people/${MARIA.id}/relationships`);
    await expect(page.getByText('Rossouw, Jacobus').first()).toBeVisible();

    expect(await wideAt(page, `/people/${MARIA.id}`)).toEqual([]);
    expect(await wideAt(page, `/people/${MARIA.id}/relationships`)).toEqual([]);
  });

  // NFR-05. `relationship-pick-empty` uses another Account, so no test here covers it.
  test('the Relationship dialogs do not scroll sideways at a desktop size', async ({
    page,
  }) => {
    const entries = screens.screens.filter(
      ({ account, name }) =>
        account === family.email && name.startsWith('relationship-')
    );

    expect(entries.map(({ name }) => name)).toHaveLength(6);

    const wide: string[] = [];

    for (const { name, route, state } of entries) {
      for (const size of DESKTOP_SIZES) {
        await page.setViewportSize(size);
        await page.goto(route);

        if (state) await states[state](page);

        await page.getByRole('dialog').waitFor();
        await page.waitForLoadState('networkidle');
        wide.push(
          ...(await wideNow(page, size)).map(text => `${name}: ${text}`)
        );
      }
    }

    expect(wide).toEqual([]);
  });

  // PPL-02
  test('a parent that would make a cycle shows the alert and adds no Relationship', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto(`/people/${MARIA.id}/relationships`);
    await states['relationship-cycle'](page);
    await expect(
      page.getByRole('alert').filter({ hasText: 'ancestor' })
    ).toBeVisible();

    await page.goto(`/people/${MARIA.id}/relationships`);
    await expect(page.getByRole('link', { name: /^Edit\s*,/ })).toHaveCount(8);
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
