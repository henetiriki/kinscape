import type { Locator, Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import tokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/lib/design/tokens.mts';

// NFR-06: the design kit's controls, with the keyboard and by name.

const matrix = (page: Page) =>
  page.getByRole('figure', { name: 'State matrix' });

const REAL_CONTROLS = ':is(button, input, a):not([inert] *)';

test('Tab visits each enabled control with a 2px brand ring, and skips the disabled ones', async ({
  page,
}) => {
  await page.goto('/design-kit/states');

  const expected = await page.locator(REAL_CONTROLS).evaluateAll(
    nodes =>
      nodes.filter(
        node =>
          !(node as HTMLButtonElement).disabled &&
          node.checkVisibility() &&
          // Only the selected tab of a tab list is in the tab order.
          (node as HTMLElement).tabIndex >= 0
      ).length
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
  {
    heading: 'Inputs and actions',
    label: 'Inputs',
    path: '/design-kit/inputs',
  },
  {
    heading: 'Surfaces and overlays',
    label: 'Surfaces',
    path: '/design-kit/surfaces',
  },
  {
    heading: 'Map furniture',
    label: 'Map furniture',
    path: '/design-kit/map-furniture',
  },
  {
    heading: 'MapLibre layer stack',
    label: 'Map style',
    path: '/design-kit/map-style',
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
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { exact: true, name: 'KinScape design kit' })
    ).toBeFocused();

    for (const { label } of BOARD_LINKS) {
      await page.keyboard.press('Tab');
      await expect(
        nav.getByRole('link', { exact: true, name: label })
      ).toBeFocused();
    }
  });
}

// NFR-06: the kit's bar on a desktop and on a phone, and the sheet a phone opens.
test.describe('the kit bar', () => {
  const title = (page: Page) =>
    page.getByRole('link', { exact: true, name: 'KinScape design kit' });
  const nav = (page: Page) => page.getByRole('navigation', { name: 'Boards' });
  const boards = (page: Page) => page.getByRole('button', { name: 'Boards' });

  test('on a desktop is 61px, with the title link and no underline on the current board', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto('/design-kit/type');

    expect((await page.getByRole('banner').boundingBox())!.height).toBeCloseTo(
      61,
      0
    );
    await expect(title(page)).toHaveAttribute('href', '/design-kit');
    await expect(nav(page).getByRole('link', { name: 'Typography' })).toHaveCSS(
      'text-decoration-line',
      'none'
    );
    await expect(boards(page)).toBeHidden();
  });

  for (const [name, size] of [
    ['390 wide', { height: 844, width: 390 }],
    ['800 by 450', { height: 450, width: 800 }],
  ] as const) {
    test(`at ${name} shows the title and a 44px button, no links`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/design-kit');

      await expect(title(page)).toBeVisible();
      await expect(nav(page)).toBeHidden();
      expect((await boards(page).boundingBox())!.height).toBe(44);
      await expect(boards(page)).toHaveAttribute('aria-haspopup', 'dialog');
    });
  }

  test.describe('the sheet', () => {
    test.use({ viewport: { height: 844, width: 390 } });

    const sheet = (page: Page) => page.getByRole('dialog', { name: 'Boards' });
    const open = async (page: Page, path = '/design-kit/type') => {
      await page.goto(path);
      await boards(page).click();
      await expect(sheet(page)).toBeVisible();
    };

    test('has nine rows, the current one tinted, and All boards', async ({
      page,
    }) => {
      await open(page);

      const links = sheet(page).getByRole('link');

      await expect(links).toHaveCount(10);
      await expect(links.nth(9)).toHaveText('All boards');
      await expect(links.first()).toHaveAttribute('aria-current', 'page');
      await expect(links.first()).toHaveCSS(
        'background-color',
        'rgb(230, 238, 228)'
      );
      await expect(links.nth(1)).not.toHaveAttribute('aria-current');
    });

    test('keeps Tab inside it', async ({ page }) => {
      await open(page);

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        // Past the last control focus leaves the page for the browser, so the body holds it.
        expect(
          await page.evaluate(
            () =>
              document.activeElement === document.body ||
              document.activeElement?.closest('dialog') !== null
          )
        ).toBe(true);
      }
    });

    test('closes on Esc, and focus returns to the button', async ({ page }) => {
      await open(page);
      await page.keyboard.press('Escape');
      await expect(sheet(page)).toBeHidden();
      await expect(boards(page)).toBeFocused();
    });

    test('closes on Close, and focus returns to the button', async ({
      page,
    }) => {
      await open(page);
      await sheet(page).getByRole('button', { name: 'Close' }).click();
      await expect(sheet(page)).toBeHidden();
      await expect(boards(page)).toBeFocused();
    });

    test('closes on the scrim', async ({ page }) => {
      await open(page);
      await page.mouse.click(195, 20);
      await expect(sheet(page)).toBeHidden();
    });

    test('closes on choosing a board', async ({ page }) => {
      await open(page);
      await sheet(page)
        .getByRole('link', { name: /Colour/ })
        .click();
      await expect(page).toHaveURL('/design-kit/colour');
      await expect(sheet(page)).toBeHidden();
    });

    test('marks All boards on the index', async ({ page }) => {
      await open(page, '/design-kit');
      await expect(
        sheet(page).getByRole('link', { name: 'All boards' })
      ).toHaveAttribute('aria-current', 'page');
    });

    test('slides in over 240ms, unless reduced motion is on', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await open(page);
      await expect(sheet(page)).toHaveCSS('animation-duration', '0.24s');

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await sheet(page).getByRole('button', { name: 'Close' }).click();
      await boards(page).click();
      await expect(sheet(page)).toHaveCSS('animation-name', 'none');
    });
  });
});

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

  expect(samples).toHaveLength(22);

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

// NFR-06: the map style board has the layout's banner only, and previews drawn from the map tokens.
test.describe('the map style board', () => {
  const { map } = resolveTokens(tokens);

  const rgb = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

    return `rgb(${r}, ${g}, ${b})`;
  };

  const preview = (page: Page, id: string) =>
    page
      .getByRole('row')
      .filter({ hasText: id })
      .first()
      .getByRole('cell')
      .nth(1)
      .locator('span')
      .first();

  test('has one banner and 20 layers', async ({ page }) => {
    await page.goto('/design-kit/map-style');
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(21);
  });

  test('draws the sea and a border line from the tokens', async ({ page }) => {
    await page.goto('/design-kit/map-style');
    await expect(preview(page, 'background')).toHaveCSS(
      'background-color',
      rgb(map.sea)
    );
    await expect(preview(page, 'polity-line')).toHaveCSS(
      'background-image',
      new RegExp(rgb(map.border.colour).replace(/[()]/g, '\\$&'))
    );
  });
});

// NFR-05, NFR-06: the Type, States and Feedback boards on a phone, in portrait and landscape.
test.describe('the boards on a phone', () => {
  for (const [name, size] of [
    ['390 wide', { height: 844, width: 390 }],
    ['800 by 450', { height: 450, width: 800 }],
  ] as const) {
    for (const board of ['type', 'states', 'feedback', 'inputs']) {
      test(`${board} at ${name} does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto(`/design-kit/${board}`);

        const widths = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));

        expect(widths.scroll).toBe(widths.client);
      });
    }
  }

  test.describe('at 390 wide', () => {
    test.use({ viewport: { height: 844, width: 390 } });

    for (const board of ['type', 'states', 'feedback', 'inputs']) {
      test(`${board} is one column inside 16px gutters`, async ({ page }) => {
        await page.goto(`/design-kit/${board}`);

        const outside = await page.locator('main *').evaluateAll(
          nodes =>
            nodes
              .filter(node => node.checkVisibility())
              .map(node => node.getBoundingClientRect())
              .filter(
                box => box.width > 0 && (box.left < 16 || box.right > 374)
              ).length
        );

        expect(outside).toBe(0);
      });
    }

    test('type rows share one left edge and the heading row is hidden', async ({
      page,
    }) => {
      await page.goto('/design-kit/type');
      await expect(
        page.getByRole('columnheader', { name: 'Style' })
      ).toBeHidden();

      const lefts = await page
        .getByRole('row')
        .evaluateAll(rows =>
          rows
            .filter(row => row.checkVisibility())
            .map(row => row.getBoundingClientRect().left)
        );

      expect(new Set(lefts).size).toBe(1);
    });

    test('states labels each cell and keeps 44px hit areas', async ({
      page,
    }) => {
      await page.goto('/design-kit/states');
      await expect(matrix(page).getByText('Pressed').last()).toBeVisible();

      const live = matrix(page).locator(':not([inert] *)');

      for (const control of [
        live.getByRole('button', { name: 'Sign in' }).first(),
        live.getByRole('button', { name: 'Copy chain' }).first(),
        live.getByRole('button', { name: 'Zoom in' }).first(),
        live.getByRole('checkbox', { name: 'Checkbox off' }).first(),
        live.getByRole('button', { name: 'Birth' }).first(),
        live.locator('label', { hasText: 'Month' }).first(),
        live.getByRole('tab', { name: 'Filters' }).first(),
      ]) {
        expect(await hitsControl(control, 0, 21)).toBe(true);
        expect(await hitsControl(control, 0, -21)).toBe(true);
      }
    });
  });
});

// NFR-05, NFR-06: the Colour, Foundations and Map style boards on a phone, in portrait and landscape.
test.describe('the other boards on a phone', () => {
  const boards = ['colour', 'foundations', 'map-style'];

  for (const [name, size] of [
    ['390 wide', { height: 844, width: 390 }],
    ['844 by 390', { height: 390, width: 844 }],
  ] as const) {
    test.describe(`at ${name}`, () => {
      test.use({ viewport: size });

      for (const board of boards) {
        test(`${board} does not scroll sideways`, async ({ page }) => {
          await page.goto(`/design-kit/${board}`);

          const widths = await page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));

          expect(widths.scroll).toBe(widths.client);
        });
      }

      test('map style shows 20 cards with their labels and a scrolling code sample', async ({
        page,
      }) => {
        await page.goto('/design-kit/map-style');
        await expect(
          page.getByRole('columnheader', { name: 'Layer id' })
        ).toBeHidden();

        const rows = page
          .getByRole('table', { name: 'Layer stack' })
          .getByRole('row')
          .filter({ visible: true });

        await expect(rows).toHaveCount(20);
        await expect(rows.getByText('Covers', { exact: true })).toHaveCount(20);
        await expect(
          rows.getByText('Covers', { exact: true }).first()
        ).toBeVisible();

        // At 844 wide the sample fits its box; only the narrow phone needs the scroll.
        if (size.width === 390) {
          const code = await page
            .locator('pre')
            .evaluate(pre => pre.scrollWidth > pre.clientWidth);

          expect(code).toBe(true);
        }
      });
    });
  }

  test.describe('at 390 wide', () => {
    test.use({ viewport: { height: 844, width: 390 } });

    for (const board of boards) {
      test(`${board} stays inside 16px gutters`, async ({ page }) => {
        await page.goto(`/design-kit/${board}`);

        const outside = await page.locator('main *').evaluateAll(
          nodes =>
            nodes
              .filter(node => node.checkVisibility())
              .filter(node => !node.closest('pre'))
              .map(node => node.getBoundingClientRect())
              .filter(
                box => box.width > 0 && (box.left < 16 || box.right > 374)
              ).length
        );

        expect(outside).toBe(0);
      });
    }
  });

  test.describe('at 800 wide and 900 tall', () => {
    test.use({ viewport: { height: 900, width: 800 } });

    test('map style keeps its column headers', async ({ page }) => {
      await page.goto('/design-kit/map-style');
      await expect(
        page.getByRole('columnheader', { name: 'Layer id' })
      ).toBeVisible();
    });

    test('colour keeps five swatches in a row', async ({ page }) => {
      await page.goto('/design-kit/colour');

      const tops = await page
        .locator('section[aria-label="Brand"] > div:last-child > div')
        .evaluateAll(cards =>
          cards.slice(0, 5).map(card => card.getBoundingClientRect().top)
        );

      expect(new Set(tops).size).toBe(1);
    });

    test('foundations keeps Spacing beside Corner radius', async ({ page }) => {
      await page.goto('/design-kit/foundations');

      const top = (label: string) =>
        page
          .locator(`section[aria-label="${label}"]`)
          .evaluate(section => section.getBoundingClientRect().top);

      expect(await top('Spacing')).toBe(await top('Corner radius'));
    });
  });
});

// NFR-05: the index lists the boards in two columns on a desktop and one on a phone.
test.describe('the boards index', () => {
  const corners = async (page: Page) => {
    await page.goto('/design-kit');

    return page
      .getByRole('main')
      .getByRole('listitem')
      .evaluateAll(items =>
        items.map(item => {
          const { left, top } = item.getBoundingClientRect();

          return { left, top };
        })
      );
  };

  test('on a desktop fills the left column first, then the right', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1440 });

    const boxes = await corners(page);

    expect(boxes[5].top).toBe(boxes[0].top);
    expect(boxes[5].left).toBeGreaterThan(boxes[0].left);
    expect(boxes[8].left).toBe(boxes[5].left);
    expect(boxes[4].top).toBeGreaterThan(boxes[3].top);
    expect(boxes[4].left).toBe(boxes[0].left);
  });

  test('on a phone is one column', async ({ page }) => {
    await page.setViewportSize({ height: 941, width: 390 });

    const boxes = await corners(page);

    expect(new Set(boxes.map(box => box.left)).size).toBe(1);
  });
});
