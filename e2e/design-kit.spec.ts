import { expect, type Locator, type Page, test } from '@playwright/test';

// NFR-06: the design kit's controls, with the keyboard and by name.

const matrix = (page: Page) =>
  page.getByRole('figure', { name: 'State matrix' });

const REAL_CONTROLS = ':is(button, input, a):not([inert] *)';

test('Tab visits each enabled control with a 2px brand ring, and skips the disabled ones', async ({
  page,
}) => {
  await page.goto('/design-kit');

  const expected = await page
    .locator(REAL_CONTROLS)
    .evaluateAll(
      nodes =>
        nodes.filter(node => !(node as HTMLButtonElement).disabled).length
    );

  // The two radios of the Segmented control share one tab stop.
  const stops = expected - 1;

  await page.locator('body').click({ position: { x: 1, y: 1 } });

  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    const ring = await focused.evaluate(node => {
      const style = getComputedStyle(node.closest('label') ?? node);

      return {
        colour: style.outlineColor,
        disabled: (node as HTMLButtonElement).disabled === true,
        offset: style.outlineOffset,
        style: style.outlineStyle,
        width: style.outlineWidth,
      };
    });

    expect({ ...ring, colour: undefined }).toEqual({
      colour: undefined,
      disabled: false,
      offset: '2px',
      style: 'solid',
      width: '2px',
    });
    expect(ring.colour).toBe('rgb(38, 79, 41)');
  }
});

test('controls have names, and toggles report their state', async ({
  page,
}) => {
  await page.goto('/design-kit');

  const live = matrix(page).locator(':not([inert] *)');

  await expect(
    live.getByRole('button', { name: 'Zoom in' }).first()
  ).toBeVisible();
  await expect(
    live.getByRole('checkbox', { name: 'Checkbox off' }).first()
  ).not.toBeChecked();
  await expect(
    live.getByRole('checkbox', { name: 'Checkbox on' }).first()
  ).toBeChecked();
  await expect(
    live.getByRole('button', { name: 'Birth' }).first()
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(
    live.getByRole('button', { name: 'Marriage' }).first()
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    live.getByRole('radio', { checked: true, name: 'Year' }).first()
  ).toBeChecked();
  await expect(
    live.getByRole('tab', { name: 'Layers' }).first()
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    live.getByRole('tab', { name: 'Filters' }).first()
  ).toHaveAttribute('aria-selected', 'false');
});

// The point 22px from a control's centre is still on the control: a 44px hit area.
const hitsControl = async (control: Locator, dx: number, dy: number) => {
  await control.scrollIntoViewIfNeeded();

  const box = (await control.boundingBox())!;

  return control.evaluate(
    (node, point) => {
      const hit = document.elementFromPoint(point.x, point.y);

      return hit !== null && (node === hit || node.contains(hit));
    },
    { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
  );
};

test('a small control has a 44px hit area', async ({ page }) => {
  await page.goto('/design-kit');

  const live = matrix(page).locator(':not([inert] *)');
  // Away from the neighbouring checkbox, whose 44px area overlaps this one.
  const checkbox = live.getByRole('checkbox', { name: 'Checkbox off' }).first();
  const chip = live.getByRole('button', { name: 'Birth' }).first();
  const segment = live.locator('label', { hasText: 'Month' }).first();
  const tab = live.getByRole('tab', { name: 'Filters' }).first();

  expect(await hitsControl(checkbox, -21, 0)).toBe(true);
  expect(await hitsControl(checkbox, 0, 21)).toBe(true);
  expect(await hitsControl(chip, 0, 21)).toBe(true);
  expect(await hitsControl(chip, 0, -21)).toBe(true);
  expect(await hitsControl(segment, 0, 21)).toBe(true);
  expect(await hitsControl(tab, 0, 21)).toBe(true);
  expect(await hitsControl(tab, 0, -21)).toBe(true);
});

test('the live controls carry hashed class names, not the plain ones', async ({
  page,
}) => {
  await page.goto('/design-kit');

  const live = matrix(page).locator(':not([inert] *)');

  for (const [control, plain] of [
    [live.getByRole('button', { name: 'Sign in' }), 'btnPrimary'],
    [live.getByRole('button', { name: 'Zoom in' }), 'iconBtn'],
    [live.getByRole('link', { name: 'Attributions' }), 'textLink'],
    [live.getByRole('checkbox', { name: 'Checkbox off' }), 'checkbox'],
    [live.getByRole('button', { name: 'Birth' }), 'chip'],
    [live.locator('label', { hasText: 'Month' }), 'segItem'],
    [live.getByRole('tab', { name: 'Filters' }), 'tab'],
  ] as const) {
    const tokens = await control
      .first()
      .evaluate(node => Array.from(node.classList));

    expect(tokens.some(token => token.includes(plain))).toBe(true);
    expect(tokens).not.toContain(plain);
  }
});

test('the arrow keys move the choice in a Segmented control', async ({
  page,
}) => {
  await page.goto('/design-kit');

  const live = matrix(page).locator(':not([inert] *)');

  await live.getByRole('radio', { name: 'Year' }).first().focus();
  await page.keyboard.press('ArrowRight');

  await expect(
    live.getByRole('radio', { name: 'Month' }).first()
  ).toBeFocused();
});
