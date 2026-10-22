import { expect, type Locator, type Page, test } from '@playwright/test';

import tokens from '../design/tokens.json';
import { resolveTokens } from '../lib/design/tokens.mts';

// NFR-06: the design kit's controls, with the keyboard and by name.

const matrix = (page: Page) =>
  page.getByRole('figure', { name: 'State matrix' });

const REAL_CONTROLS = ':is(button, input, a):not([inert] *)';

test('Tab visits each enabled control with a 2px brand ring, and skips the disabled ones', async ({
  page,
}) => {
  await page.goto('/design-kit/states');

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

    // A field shows focus as a 2px brand border on its box, with no outline.
    if (
      await focused.evaluate(
        node => node instanceof HTMLInputElement && node.type === 'text'
      )
    ) {
      expect(
        await focused.evaluate(node => {
          const box = getComputedStyle(node.parentElement!);

          return [
            box.borderTopWidth,
            box.borderTopColor,
            getComputedStyle(node).outlineStyle,
          ];
        })
      ).toEqual(['2px', 'rgb(38, 79, 41)', 'none']);

      continue;
    }

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
  await page.goto('/design-kit/states');

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
  await page.goto('/design-kit/states');

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
  await page.goto('/design-kit/states');

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
  await page.goto('/design-kit/states');

  const live = matrix(page).locator(':not([inert] *)');

  await live.getByRole('radio', { name: 'Year' }).first().focus();
  await page.keyboard.press('ArrowRight');

  await expect(
    live.getByRole('radio', { name: 'Month' }).first()
  ).toBeFocused();
});

// NFR-06: each swatch on the colour board is filled with its token.
test('colour swatches are filled with their tokens', async ({ page }) => {
  await page.goto('/design-kit/colour');

  const fill = (name: string) =>
    page
      .locator('code', { hasText: new RegExp(`^${name}$`) })
      .locator('xpath=../preceding-sibling::div');

  await expect(fill('--brand')).toHaveCSS(
    'background-color',
    'rgb(38, 79, 41)'
  );
  await expect(fill('--pin')).toHaveCSS('background-color', 'rgb(154, 59, 18)');
  await expect(fill('map.hatch.colour')).toHaveCSS(
    'background-color',
    'rgb(139, 74, 28)'
  );
});

// NFR-06: the kit's index and nav.
const BOARD_LINKS = [
  {
    heading: 'Typography and hierarchy',
    label: 'Typography',
    path: '/design-kit/type',
  },
  { heading: 'Colour', label: 'Colour', path: '/design-kit/colour' },
  {
    heading: 'Spacing, shape, depth, icons, motion',
    label: 'Foundations',
    path: '/design-kit/foundations',
  },
  {
    heading: 'Component states',
    label: 'Component states',
    path: '/design-kit/states',
  },
  {
    heading: 'Feedback and validation',
    label: 'Feedback',
    path: '/design-kit/feedback',
  },
];

test('the index links to each board', async ({ page }) => {
  for (const { heading, path } of BOARD_LINKS) {
    await page.goto('/design-kit');
    await page
      .getByRole('main')
      .getByRole('link', { exact: true, name: heading })
      .click();
    await expect(page).toHaveURL(path);
    await expect(
      page.getByRole('main').getByText(heading, { exact: true })
    ).toBeVisible();
  }
});

for (const path of ['/design-kit', ...BOARD_LINKS.map(board => board.path)]) {
  test(`on ${path}, the nav marks the current board and Tab reaches each link in order`, async ({
    page,
  }) => {
    await page.goto(path);

    const nav = page.getByRole('navigation', { name: 'Boards' });

    for (const { label, path: href } of BOARD_LINKS) {
      const link = nav.getByRole('link', { exact: true, name: label });

      if (href === path) {
        await expect(link).toHaveAttribute('aria-current', 'page');
      } else {
        await expect(link).not.toHaveAttribute('aria-current');
      }
    }

    await page.locator('body').click({ position: { x: 1, y: 1 } });

    for (const { label } of BOARD_LINKS) {
      await page.keyboard.press('Tab');
      await expect(
        nav.getByRole('link', { exact: true, name: label })
      ).toBeFocused();
    }
  });
}

// MAP-03, NFR-06: the map date field on the feedback board, in the first (Default) card.
test.describe('the map date field', () => {
  const ERROR_BORDER = 'rgb(180, 65, 47)';

  const open = async (page: Page) => {
    await page.goto('/design-kit/feedback');

    const card = page.locator('div[class*="card"]').first();

    return { card, field: card.getByRole('textbox', { name: 'Date shown' }) };
  };

  const border = (field: Locator) =>
    field.evaluate(node => {
      const box = getComputedStyle(node.parentElement!);

      return [box.borderTopWidth, box.borderTopColor];
    });

  test('keeps 1901-02-30 with its message and fix, then Esc puts the date back', async ({
    page,
  }) => {
    const { card, field } = await open(page);

    await field.fill('1901-02-30');
    await expect(card.getByRole('alert')).toHaveCount(0);
    await field.press('Enter');

    await expect(field).toHaveValue('1901-02-30');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(card.getByRole('alert')).toHaveText(
      'February 1901 has 28 days.'
    );
    await expect(
      card.getByRole('button', { name: 'Go to 1901-02-28' })
    ).toBeVisible();
    expect(await border(field)).toEqual(['2px', ERROR_BORDER]);

    await field.press('Escape');

    await expect(field).toHaveValue('1901');
    await expect(card.getByRole('alert')).toHaveCount(0);
  });

  test('takes the fix, and pads 1901-6-4', async ({ page }) => {
    const { card, field } = await open(page);

    await field.fill('1901-02-30');
    await field.press('Enter');
    await card.getByRole('button', { name: 'Go to 1901-02-28' }).click();
    await expect(field).toHaveValue('1901-02-28');

    await field.fill('1901-6-4');
    await field.press('Enter');
    await expect(field).toHaveValue('1901-06-04');
    expect(await border(field)).toEqual(['2px', 'rgb(38, 79, 41)']);
  });

  test('says what is wrong with 14/06/1901, 1650 and a later date', async ({
    page,
  }) => {
    const { card, field } = await open(page);

    for (const [text, message] of [
      ['14/06/1901', 'Use 1901, 1901-06 or 1901-06-14.'],
      ['1650', 'Dates run from 1652 to today.'],
      ['2031', "That's after today."],
    ]) {
      await field.fill(text);
      await field.press('Enter');
      await expect(card.getByRole('alert')).toHaveText(message);
    }

    await expect(
      card.getByRole('button', { name: 'Go to today' })
    ).toBeVisible();
  });

  test('checks when focus leaves', async ({ page }) => {
    const { card, field } = await open(page);

    await field.fill('1901-13');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await expect(card.getByRole('alert')).toHaveText(
      'Use 1901, 1901-06 or 1901-06-14.'
    );
  });
});

// NFR-06: each sample on the type board computes to its tokens.
test('each type sample has its style tokens', async ({ page }) => {
  await page.goto('/design-kit/type');

  const samples = await page.locator('[data-variant]').evaluateAll(nodes =>
    nodes.map(node => {
      const token = node
        .getAttribute('data-variant')!
        .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      // A probe styled by the same tokens: the family resolves through next/font to a generated name.
      const probe = document.createElement('div');

      probe.style.cssText = [
        ['font-family', 'font'],
        ['font-size', 'size'],
        ['font-weight', 'weight'],
        ['letter-spacing', 'tracking'],
        ['line-height', 'line'],
      ]
        .map(([property, part]) => `${property}: var(--type-${token}-${part})`)
        .join(';');
      document.body.append(probe);

      const read = (element: Element) => {
        const style = getComputedStyle(element);

        return [
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.letterSpacing,
          style.lineHeight,
        ];
      };
      const result = { actual: read(node), expected: read(probe) };

      probe.remove();

      return result;
    })
  );

  expect(samples).toHaveLength(14);

  for (const { actual, expected } of samples) {
    expect(actual).toEqual(expected);
  }
});

// NFR-06: each map label sample computes to its map tokens.
test('each map label has its token colour, size, weight and tracking', async ({
  page,
}) => {
  const { map } = resolveTokens(tokens);
  const rgb = (hex: string) =>
    `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
  const SAMPLES = [
    ['ORANGE FREE STATE', 'polity-label', '600'],
    ['contested · Orange River Colony', 'contested-label', '400'],
    ['Kimberley', 'place-label', '500'],
    ['Vaal', 'river-label', '400'],
    ['BECHUANALAND PROTECTORATE', 'context-label', '400'],
    ['INDIAN OCEAN', 'water-label', '400'],
  ] as const;

  await page.goto('/design-kit/type');
  const panel = page.locator('[class*="mapLabels"]');

  for (const [text, key, weight] of SAMPLES) {
    const token = map[key];
    const tracking =
      'tracking' in token
        ? Math.round(token.tracking * token.size * 100) / 100
        : 0;
    const sample = panel.getByText(text, { exact: true });

    await expect(sample).toHaveCSS('color', rgb(token.colour));
    await expect(sample).toHaveCSS('font-size', `${token.size}px`);
    await expect(sample).toHaveCSS('font-weight', weight);
    await expect(sample).toHaveCSS(
      'letter-spacing',
      tracking === 0 ? 'normal' : `${tracking}px`
    );
  }

  await expect(panel.getByText('INDIAN OCEAN')).toHaveCSS(
    'background-color',
    rgb(map.sea)
  );
});

// NFR-06: the Foundations board draws bars, radii and shadows from the tokens.
test('the foundations board draws from the tokens', async ({ page }) => {
  await page.goto('/design-kit/foundations');

  const spacing = page.getByRole('region', { name: 'Spacing' });

  for (const value of Object.values(tokens.space)) {
    const bar = spacing
      .getByText(value, { exact: true })
      .locator('xpath=following-sibling::span[1]');

    await expect(bar).toHaveCSS('width', `${Number.parseInt(value, 10) * 4}px`);
  }

  const corners = page.getByRole('region', { name: 'Corner radius' });

  for (const name of ['small', 'control', 'panel', 'sheet', 'full'] as const) {
    const label = name === 'full' ? name : tokens.radius[name];

    await expect(
      corners
        .getByText(label, { exact: true })
        .locator('xpath=preceding-sibling::span[1]')
    ).toHaveCSS('border-top-left-radius', tokens.radius[name]);
  }

  const elevation = page.getByRole('region', { name: 'Elevation' });

  for (const value of Object.values(tokens.shadow).slice(0, 3)) {
    const card = elevation
      .getByText(value, { exact: true })
      .locator('xpath=..');

    await expect(card).toHaveCSS('box-shadow', /rgba\(24, 33, 27/);
  }
});

// NFR-06: the banner and the toasts on the feedback board.
test('the banner action takes a white focus ring', async ({ page }) => {
  await page.goto('/design-kit/feedback');

  const retry = page.getByRole('button', { name: 'Retry' });

  await retry.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
  await expect(retry).toHaveCSS('outline-width', '2px');
});

test.describe('a toast rises in', () => {
  const toast = (page: Page) =>
    page.getByText('Jurisdiction chain copied.').locator('..');

  test('with motion allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/design-kit/feedback');
    await expect(toast(page)).not.toHaveCSS('animation-name', 'none');
  });

  test('not when reduced motion is on', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/design-kit/feedback');
    await expect(toast(page)).toHaveCSS('animation-name', 'none');
  });
});
