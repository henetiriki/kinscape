import type { Locator, Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// NFR-06, NFR-05, EXP-03: board 06, the inputs and actions components.

const section = (page: Page, name: string) =>
  page.getByRole('region', { name });

const heightOf = async (control: Locator) =>
  Math.round((await control.boundingBox())!.height);

// The point `dx`, `dy` from a control's centre is still on the control.
const hits = async (control: Locator, dx: number, dy: number) => {
  // At the middle of the screen, so the point is neither off it nor under the banner.
  await control.evaluate(node => node.scrollIntoView({ block: 'center' }));

  const box = (await control.boundingBox())!;

  return control.evaluate(
    (node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);

      return hit !== null && (node === hit || node.contains(hit));
    },
    { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
  );
};

test.describe('on a desktop', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  test('a button is 50, 44, 40 or 36px tall by size', async ({ page }) => {
    await page.goto('/design-kit/inputs');

    const buttons = section(page, 'Buttons');
    const first = (name: string) =>
      buttons.getByRole('button', { exact: true, name }).first();

    expect(await heightOf(first('Sign in'))).toBe(50);
    expect(await heightOf(first('Clear filters'))).toBe(44);
    expect(await heightOf(first('Jump to 1898'))).toBe(40);
    expect(await heightOf(first('Copy chain'))).toBe(36);
  });

  test('the 36px button and the chip × keep a 44px hit area', async ({
    page,
  }) => {
    await page.goto('/design-kit/inputs');

    const copy = section(page, 'Buttons')
      .getByRole('button', { exact: true, name: 'Copy chain' })
      .first();
    const remove = section(page, 'Chips')
      .getByRole('button', { name: 'Remove Rossouw' })
      .first();

    expect(await hits(copy, 0, 21)).toBe(true);
    expect(await hits(copy, 0, -21)).toBe(true);
    expect(await hits(remove, 21, 0)).toBe(true);
    expect(await hits(remove, 0, -21)).toBe(true);
  });

  test('the eye shows and hides the password', async ({ page }) => {
    await page.goto('/design-kit/inputs');

    const fields = section(page, 'Text fields');
    const input = fields.getByLabel('Password', { exact: true }).first();

    await expect(input).toHaveAttribute('type', 'password');
    await fields.getByRole('button', { name: 'Show password' }).first().click();
    await expect(input).toHaveAttribute('type', 'text');
    await fields.getByRole('button', { name: 'Hide password' }).first().click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('the token field removes a chip, moves focus to the input and adds on Enter', async ({
    page,
  }) => {
    await page.goto('/design-kit/inputs');

    const field = page.getByRole('group').first();
    const input = field.getByRole('textbox');

    await field.getByRole('button', { name: 'Remove Rossouw' }).click();
    await expect(field.getByRole('button')).toHaveCount(0);
    await expect(input).toBeFocused();

    await input.fill('Naidoo');
    await input.press('Enter');
    await expect(
      field.getByRole('button', { name: 'Remove Naidoo' })
    ).toBeVisible();
  });

  test('"/" focuses the search field', async ({ page }) => {
    await page.goto('/design-kit/inputs');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('/');
    await expect(
      section(page, 'Text fields')
        .getByRole('searchbox', { name: 'Search people and places' })
        .first()
    ).toBeFocused();
  });

  test('Left and Right move between the tabs and select them', async ({
    page,
  }) => {
    await page.goto('/design-kit/inputs');

    const tabs = section(page, 'Tabs').getByRole('tablist').first();
    const filters = tabs.getByRole('tab', { name: 'Filters, 1 active' });
    const layers = tabs.getByRole('tab', { name: 'Layers' });

    await filters.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(layers).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(filters).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(layers).toBeFocused();
  });

  for (const [part, url, shown, hidden, next] of [
    [1, '/design-kit/inputs', 'Key hints', 'Page header', 2],
    [2, '/design-kit/inputs?part=2', 'Person row', 'Buttons', 1],
  ] as const) {
    test(`part ${part} shows its sections and links to part ${next}, in 7500px or less`, async ({
      page,
    }) => {
      await page.goto(url);
      await expect(section(page, shown)).toBeVisible();
      await expect(section(page, hidden)).toBeHidden();
      await expect(
        page.getByRole('link', { name: new RegExp(`^Part ${next}:`) })
      ).toBeVisible();
      await expect(page.getByText(`part ${part} of 2`)).toBeVisible();

      const height = await page.evaluate(
        () => document.documentElement.scrollHeight
      );

      expect(height).toBeLessThanOrEqual(7500);
    });
  }
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('card buttons and event chips are 44 tall, a removable chip 36', async ({
    page,
  }) => {
    await page.goto('/design-kit/inputs');

    expect(
      await heightOf(
        section(page, 'Buttons')
          .getByRole('button', { exact: true, name: 'Jump to 1898' })
          .first()
      )
    ).toBe(44);

    await page.goto('/design-kit/inputs?part=2');

    const chips = section(page, 'Chips');

    expect(
      await heightOf(chips.getByRole('button', { name: 'Birth' }).first())
    ).toBe(44);
    expect(
      await heightOf(
        chips.getByRole('button', { name: 'Remove Rossouw' }).first()
      )
    ).toBe(36);
  });

  for (const [part, url, first, other, next] of [
    [1, '/design-kit/inputs', 'Buttons', 'Chips', 2],
    [2, '/design-kit/inputs?part=2', 'Chips', 'Buttons', 3],
    [3, '/design-kit/inputs?part=3', 'Tabs', 'Chips', 4],
    [4, '/design-kit/inputs?part=4', 'Page header', 'Tabs', 1],
  ] as const) {
    test(`part ${part} shows its sections, links to part ${next}, is 7500px or less and does not scroll sideways`, async ({
      page,
    }) => {
      await page.goto(url);
      await expect(section(page, first)).toBeVisible();
      await expect(section(page, other)).toBeHidden();
      await expect(
        page.getByRole('link', { name: new RegExp(`^Part ${next}:`) })
      ).toBeVisible();
      await expect(page.getByText(`part ${part} of 4`)).toBeVisible();

      const size = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight,
        scroll: document.documentElement.scrollWidth,
      }));

      expect(size.scroll).toBe(size.client);
      expect(size.height).toBeLessThanOrEqual(7500);
    });

    test(`part ${part} keeps a 44px target on every control`, async ({
      page,
    }) => {
      await page.goto(url);

      const controls = page
        .locator(
          'main :is(button, input, select, a, [role="tab"]):not([inert] *)'
        )
        .filter({ visible: true });
      const count = await controls.count();

      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const control = controls.nth(i);
        const box = (await control.boundingBox())!;

        if (box.height < 44) {
          expect(await hits(control, 0, 21), `control ${i} below`).toBe(true);
          expect(await hits(control, 0, -21), `control ${i} above`).toBe(true);
        }

        if (box.width < 44) {
          expect(await hits(control, 21, 0), `control ${i} right`).toBe(true);
          expect(await hits(control, -21, 0), `control ${i} left`).toBe(true);
        }
      }
    });
  }
});
