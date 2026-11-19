import type { Locator, Page } from '@playwright/test';

import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { hitsControl } from '@ks/e2e/hits';
import { GALLERY, OUTPUT, PREVIEW_PAD } from '@ks/lib/design/cards.mts';
import { CARDS } from '@ks/lib/design/states.mts';

// NFR-05, NFR-06: the look of the shared controls, read from the gallery files in
// .design-system/gallery/. Like e2e/design-gallery.spec.ts, each test opens files from disk, with no app.
// No test compares an image, so each runs on any machine, not only in the pinned image.

const gallery = join(process.cwd(), OUTPUT, GALLERY);

const open = (page: Page, name: string) =>
  page.goto(pathToFileURL(join(gallery, `${name}.html`)).href);

// A case is a figure that its caption names.
const state = (page: Page, label: string) =>
  page.getByRole('figure', { exact: true, name: label });

// The height in px of one button in one case. The caller opens the file first.
const buttonHeight = async (page: Page, label: string, name: string) =>
  Math.round(
    (await state(page, label).getByRole('button', { name }).boundingBox())!
      .height
  );

// Each control in one card state: the file, the figure, the role and the name.
const HIT_CASES = [
  ['Checkbox', 'Checkbox off · default', 'checkbox', 'Deceased'],
  ['Chip', 'Chip · default', 'button', 'Birth'],
  ['Segmented', 'Segmented · default', undefined, 'List'],
  ['Tabs', 'Tabs · default', 'tab', 'Filters'],
  ['IconButton', 'IconButton · default', 'button', 'Zoom in'],
] as const;

// Controls under 44px with no 44px hit area on a phone. Each Bug holds its controls, as "card, caption, control".
const UNDER_44: Record<string, readonly string[]> = {};
const UNDER_44_KEYS: ReadonlySet<string> = new Set(
  Object.values(UNDER_44).flat()
);

// A point 21px above, below and (for the checkbox) left of the centre is still on the control.
const expectHitAreas = async (
  page: Page,
  cases: readonly (typeof HIT_CASES)[number][]
) => {
  for (const [file, label, role, name] of cases) {
    await open(page, file);

    const figure = state(page, label);
    const control = role
      ? figure.getByRole(role, { name })
      : figure.locator('label', { hasText: name });

    expect(await hitsControl(control, 0, 21), label).toBe(true);
    expect(await hitsControl(control, 0, -21), label).toBe(true);

    if (file === 'Checkbox') {
      expect(await hitsControl(control, -21, 0), label).toBe(true);
    }
  }
};

test('the tick shows on a checked checkbox and not on an unchecked one', async ({
  page,
}) => {
  await open(page, 'Checkbox');

  const tick = (label: string) =>
    state(page, label)
      .getByRole('checkbox')
      .locator('xpath=following-sibling::*[1]');

  await expect(tick('Checkbox on · default')).toBeVisible();
  await expect(tick('Checkbox off · default')).toBeHidden();

  // The card stretches the box. The tick still lies inside the 20px input.
  const input = (await state(page, 'Checkbox on · default')
    .getByRole('checkbox')
    .boundingBox())!;
  const mark = (await tick('Checkbox on · default').boundingBox())!;

  expect(mark.x).toBeGreaterThanOrEqual(input.x);
  expect(mark.y).toBeGreaterThanOrEqual(input.y);
  expect(mark.x + mark.width).toBeLessThanOrEqual(input.x + input.width);
  expect(mark.y + mark.height).toBeLessThanOrEqual(input.y + input.height);
});

test.describe('on a phone', () => {
  // Reduced motion keeps the toast still while the test measures its box.
  test.use({ reducedMotion: 'reduce', viewport: { height: 844, width: 390 } });

  const fontSize = (field: Locator) =>
    field.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize));

  test('a focused text field and date field have text of at least 16px', async ({
    page,
  }) => {
    await open(page, 'TextField');
    await state(page, 'TextField · focus').getByRole('textbox').focus();
    expect(
      await fontSize(state(page, 'TextField · focus').getByRole('textbox'))
    ).toBeGreaterThanOrEqual(16);

    await open(page, 'DateField');

    const date = state(page, 'DateField · default').getByRole('textbox');

    await date.focus();
    expect(await fontSize(date)).toBeGreaterThanOrEqual(16);
  });

  // MAP-03: the app's sheet has no Play, so the card measures the row.
  test('the date row of the phone sheet has 4px gaps, and 8px before Play', async ({
    page,
  }) => {
    await open(page, 'DateDock');

    const figure = state(page, 'DateDock · phone sheet');
    const [back, date, forward, play] = await Promise.all(
      [
        figure.getByRole('button', { name: 'Back' }),
        // The parent of the input draws the border of the field.
        figure.getByRole('textbox', { name: 'Date shown' }).locator('xpath=..'),
        figure.getByRole('button', { name: 'Forward' }),
        figure.getByRole('button', { name: 'Play through time' }),
      ].map(async control => (await control.boundingBox())!)
    );

    expect(date.x - (back.x + back.width)).toBeCloseTo(4, 1);
    expect(forward.x - (date.x + date.width)).toBeCloseTo(4, 1);
    expect(play.x - (forward.x + forward.width)).toBeCloseTo(8, 1);
  });

  test('a checkbox, chip, segment, tab and icon button each have a 44 x 44px hit area', async ({
    page,
  }) => {
    await expectHitAreas(page, HIT_CASES);
  });

  test('the search pill and the layers button are at least 44px tall and wide', async ({
    page,
  }) => {
    for (const [file, label, target] of [
      [
        'SearchBar',
        'SearchBar · pill',
        (figure: Locator) => figure.getByRole('searchbox'),
      ],
      [
        'LayersButton',
        'LayersButton · default',
        (figure: Locator) =>
          figure.getByRole('button', { name: 'Layers and filters' }),
      ],
    ] as const) {
      await open(page, file);

      const box = (await target(state(page, label)).boundingBox())!;

      expect(box.height, label).toBeGreaterThanOrEqual(44);
      expect(box.width, label).toBeGreaterThanOrEqual(44);
    }
  });

  test('an event chip is 44px tall and a removable chip 36px', async ({
    page,
  }) => {
    await open(page, 'Chip');
    expect(await buttonHeight(page, 'Chip · default', 'Birth')).toBe(44);

    await open(page, 'RemovableChip');
    expect(
      await buttonHeight(page, 'RemovableChip · default', 'Remove Birth')
    ).toBe(36);
  });

  test('each control under 44px tall or wide keeps a 44px hit area', async ({
    page,
  }) => {
    // The test opens every card. It takes up to 28 s on a CI runner, against a 30 s limit.
    test.slow();

    const failures: string[] = [];
    const failed = new Set<string>();

    for (const { name } of CARDS) {
      await open(page, name);

      const controls = page
        .locator(
          ':is(button, input, select, a, [role="tab"]):not(:disabled):not([inert] *)'
        )
        .filter({ visible: true });
      const count = await controls.count();

      for (let i = 0; i < count; i += 1) {
        // A radio is hidden: its label holds the hit area.
        const input = controls.nth(i);
        const control =
          (await input.getAttribute('type')) === 'radio'
            ? input.locator('xpath=ancestor::label[1]')
            : input;
        const box = (await control.boundingBox())!;
        const [caption, kind] = await control.evaluate(node => [
          node.closest('figure')?.querySelector('figcaption')?.textContent ??
            '',
          `${node.tagName.toLowerCase()} ${node.getAttribute('type') ?? ''} ${
            node.getAttribute('aria-label') ?? node.textContent?.trim() ?? ''
          }`.trim(),
        ]);
        const key = `${name}, ${caption}, ${kind}`;
        const where = `${key} ${Math.round(box.width)}x${Math.round(box.height)}`;
        const points: [string, number, number][] = [];

        if (box.height < 44) {
          points.push(['below', 0, 21], ['above', 0, -21]);
        }

        if (box.width < 44) {
          points.push(['right', 21, 0], ['left', -21, 0]);
        }

        for (const [side, dx, dy] of points) {
          if (!(await hitsControl(control, dx, dy))) {
            failed.add(key);

            if (!UNDER_44_KEYS.has(key)) {
              failures.push(`${where} ${side}`);
            }
          }
        }
      }
    }

    expect(failures).toEqual([]);
    // A control that is fixed leaves the list.
    expect([...UNDER_44_KEYS].filter(key => !failed.has(key))).toEqual([]);
  });

  test('a placed banner is 80px from the top and a placed toast 164px from the bottom, inside the gutters', async ({
    page,
  }) => {
    const place = async (
      file: string,
      label: string,
      role: 'alert' | 'status'
    ) => {
      await open(page, file);

      const control = state(page, label).getByRole(role);

      await control.evaluate(node => node.setAttribute('data-placed', ''));

      return (await control.boundingBox())!;
    };

    const top = await place('Banner', 'Banner · offline', 'alert');
    const bottom = await place('Toast', 'Toast · success', 'status');

    expect(top.y).toBe(80);
    expect(844 - (bottom.y + bottom.height)).toBe(164);

    for (const box of [top, bottom]) {
      expect(box.x).toBe(16);
      expect(box.x + box.width).toBe(374);
    }
  });
});

test.describe('the row cards at their width', () => {
  for (const name of ['PersonRow', 'RelationshipRow', 'PickerRow']) {
    const card = CARDS.find(item => item.name === name)!;

    test.describe(name, () => {
      // The card `width` is the whole frame, so the viewport is as wide as the card.
      test.use({ viewport: { height: 900, width: card.width! } });

      test('shows each name on one line, where no text overlaps other text, inside the frame', async ({
        page,
      }) => {
        await open(page, name);

        const rows = await page.getByRole('figure').evaluateAll(figures =>
          figures.map(figure => {
            const row = figure.lastElementChild!;
            // The text parts: each visible element with its own text. A 1px clipped part is hidden text.
            const parts = [row, ...row.querySelectorAll('*')]
              .filter(
                node =>
                  node.checkVisibility() &&
                  [...node.childNodes].some(
                    child => child.nodeType === 3 && child.textContent!.trim()
                  )
              )
              .map(node => ({
                box: node.getBoundingClientRect(),
                line: Number.parseFloat(getComputedStyle(node).lineHeight),
                text: node.textContent!.trim(),
              }))
              .filter(part => part.box.width > 1 && part.box.height > 1);
            const box = row.getBoundingClientRect();

            return {
              caption: figure.querySelector('figcaption')!.textContent!,
              parts,
              ring: {
                bottom: box.bottom + 4,
                left: box.left - 4,
                right: box.right + 4,
              },
            };
          })
        );

        expect(rows.length).toBeGreaterThan(0);

        for (const { caption, parts, ring } of rows) {
          const [name] = parts;

          expect(name.box.height, `${caption}: ${name.text}`).toBeLessThan(
            2 * name.line
          );

          for (const [i, a] of parts.entries()) {
            for (const b of parts.slice(i + 1)) {
              const apart =
                a.box.right <= b.box.left + 0.5 ||
                b.box.right <= a.box.left + 0.5 ||
                a.box.bottom <= b.box.top + 0.5 ||
                b.box.bottom <= a.box.top + 0.5;

              expect(apart, `${caption}: "${a.text}" and "${b.text}"`).toBe(
                true
              );
            }
          }

          expect(ring.left, caption).toBeGreaterThanOrEqual(PREVIEW_PAD - 4);
          expect(ring.right, caption).toBeLessThanOrEqual(
            card.width! - PREVIEW_PAD + 4
          );
          expect(ring.bottom, caption).toBeLessThanOrEqual(card.height);
        }

        const scroll = await page.evaluate(
          pad => ({
            // The page is at least as tall as the viewport, so measure to the end of the last case.
            height: Math.ceil(
              [...document.querySelectorAll('figure')]
                .at(-1)!
                .getBoundingClientRect().bottom +
                scrollY +
                pad
            ),
            width: document.documentElement.scrollWidth,
          }),
          PREVIEW_PAD
        );

        expect(scroll.width).toBeLessThanOrEqual(card.width!);
        expect(scroll.height).toBeLessThanOrEqual(card.height);
      });
    });
  }
});

test.describe('hover', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  const background = (button: Locator) =>
    button.evaluate(node => getComputedStyle(node).backgroundColor);

  const copyChain = (page: Page) =>
    state(page, 'Button secondary · default').getByRole('button', {
      name: 'Copy chain',
    });

  test.describe('on a touch screen', () => {
    test.use({
      hasTouch: true,
      isMobile: true,
      viewport: { height: 844, width: 390 },
    });

    test('a tap leaves the background unchanged', async ({ page }) => {
      await open(page, 'Button');
      expect(
        await page.evaluate(() => matchMedia('(hover: hover)').matches)
      ).toBe(false);

      const button = copyChain(page);

      await button.scrollIntoViewIfNeeded();

      const rest = await background(button);
      const box = (await button.boundingBox())!;

      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      // The press colour returns to the rest colour over the button's transition.
      await expect.poll(() => background(button)).toBe(rest);
    });
  });

  test('a mouse over a button tints it', async ({ page }) => {
    await open(page, 'Button');

    const button = copyChain(page);

    await button.scrollIntoViewIfNeeded();

    const rest = await background(button);

    await button.hover();
    // The tint appears over the button's transition.
    await expect.poll(() => background(button)).not.toBe(rest);
  });
});

test.describe('at 1440px', () => {
  test.use({ viewport: { height: 900, width: 1440 } });

  const BRAND = 'rgb(38, 79, 41)';
  // A field shows focus as a 2px border on its box. These two states draw it in their tone.
  const BORDER = new Map([
    ['TextField · error', 'rgb(180, 65, 47)'],
    ['TextField · warning', 'rgb(183, 121, 31)'],
  ]);

  test('Tab visits each enabled control with a 2px brand ring, and skips the disabled ones', async ({
    page,
  }) => {
    for (const file of [
      'Button',
      'IconButton',
      'TextLink',
      'ArrowLink',
      'TextField',
      'Checkbox',
      'Chip',
      'Segmented',
      'Tabs',
    ]) {
      await open(page, file);

      // A radio group is one tab stop: the radios of one name in one form.
      const stops = await page
        .locator(':is(button, input, a)')
        .evaluateAll(nodes => {
          const enabled = nodes.filter(
            node =>
              !(node as HTMLButtonElement).disabled &&
              node.checkVisibility() &&
              // Only the selected tab of a tab list is in the tab order.
              (node as HTMLElement).tabIndex >= 0
          ) as HTMLInputElement[];
          const radios = enabled.filter(node => node.type === 'radio');

          return (
            enabled.length -
            radios.length +
            new Set(
              radios.map(
                radio =>
                  `${[...document.forms].findIndex(form => form === radio.form)} ${radio.name}`
              )
            ).size
          );
        });

      await page.locator('body').click({ position: { x: 1, y: 1 } });

      for (let i = 0; i < stops; i++) {
        await page.keyboard.press('Tab');

        const focused = page.locator(':focus');
        const label = await focused.evaluate(
          node =>
            node.closest('figure')?.querySelector('figcaption')?.textContent ??
            ''
        );
        const where = `${file} stop ${i + 1}, ${label}`;

        if (
          await focused.evaluate(
            node =>
              node instanceof HTMLInputElement &&
              ['password', 'search', 'text'].includes(node.type)
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
            }),
            where
          ).toEqual(['2px', BORDER.get(label) ?? BRAND, 'none']);

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

        expect({ ...ring, colour: undefined }, where).toEqual({
          colour: undefined,
          disabled: false,
          offset: '2px',
          style: 'solid',
          width: '2px',
        });
        expect(ring.colour, where).toBe(BRAND);
      }
    }
  });

  // NFR-06
  test('each Text sample has the type tokens of its variant', async ({
    page,
  }) => {
    const states = CARDS.find(({ name }) => name === 'Text')!.states.filter(
      ({ props }) => 'variant' in props
    );

    await open(page, 'Text');
    await expect(page.getByText('Sample', { exact: true })).toHaveCount(
      states.length
    );

    for (const { label, props } of states) {
      const token = String(props.variant).replace(
        /[A-Z]/g,
        letter => `-${letter.toLowerCase()}`
      );
      // A probe that the same variables style, as the sample is.
      const { actual, expected } = await state(page, label)
        .getByText('Sample', { exact: true })
        .evaluate((node, name) => {
          const probe = document.createElement('div');

          probe.style.cssText = [
            ['font-family', 'font'],
            ['font-size', 'size'],
            ['font-weight', 'weight'],
            ['letter-spacing', 'tracking'],
            ['line-height', 'line'],
          ]
            .map(
              ([property, part]) => `${property}: var(--type-${name}-${part})`
            )
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
        }, token);

      expect(actual, label).toEqual(expected);
    }
  });

  test('the Wordmark icons are 44, 36 and 32 square, with a quarter radius', async ({
    page,
  }) => {
    await open(page, 'Wordmark');

    for (const size of [44, 36, 32]) {
      const icon = state(page, `Wordmark · ${size}`).locator('img');

      expect(
        await icon.evaluate(node => [
          node.getBoundingClientRect().width,
          getComputedStyle(node).borderTopLeftRadius,
        ]),
        `Wordmark · ${size}`
      ).toEqual([size, `${size / 4}px`]);
    }
  });

  test('a button is 50, 44, 40 or 36px tall by size', async ({ page }) => {
    await open(page, 'Button');

    const height = (label: string) => buttonHeight(page, label, 'Copy chain');

    expect(await height('Button · size l')).toBe(50);
    expect(await height('Button secondary · default')).toBe(44);
    expect(await height('Button · size s')).toBe(40);
    expect(await height('Button · size xs')).toBe(36);
  });

  test('"Clear filters" on the Panel is 44px tall and narrower than the body', async ({
    page,
  }) => {
    await open(page, 'Panel');

    const figure = state(page, 'Panel · Filters tab');
    const clear = (await figure
      .getByRole('button', { name: 'Clear filters' })
      .boundingBox())!;
    const body = (await figure.getByRole('tabpanel').boundingBox())!;

    expect(Math.round(clear.height)).toBe(44);
    expect(clear.width).toBeLessThan(body.width);
  });

  test('the 36px button and the chip × keep a 44px hit area', async ({
    page,
  }) => {
    await open(page, 'Button');

    const copy = state(page, 'Button · size xs').getByRole('button', {
      name: 'Copy chain',
    });

    expect(await hitsControl(copy, 0, 21)).toBe(true);
    expect(await hitsControl(copy, 0, -21)).toBe(true);

    await open(page, 'RemovableChip');

    const remove = state(page, 'RemovableChip · default').getByRole('button', {
      name: 'Remove Birth',
    });

    expect(await hitsControl(remove, 21, 0)).toBe(true);
    expect(await hitsControl(remove, 0, -21)).toBe(true);
  });

  test('a small control has a 44px hit area', async ({ page }) => {
    await expectHitAreas(
      page,
      HIT_CASES.filter(([file]) => file !== 'IconButton')
    );
  });

  test('the banner action takes a white focus ring', async ({ page }) => {
    await open(page, 'Banner');

    const retry = state(page, 'Banner · offline').getByRole('button', {
      name: 'Retry',
    });

    await retry.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(retry).toBeFocused();
    await expect(retry).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
    await expect(retry).toHaveCSS('outline-width', '2px');
  });

  const notice = (page: Page, label: string) =>
    state(page, label).getByRole('status');

  test('a notice card has 40px buttons and is 360 wide, 380 when large', async ({
    page,
  }) => {
    await open(page, 'NoticeCard');

    const first = notice(page, 'NoticeCard · one action');

    expect(
      Math.round(
        (await first.getByRole('button').first().boundingBox())!.height
      )
    ).toBe(40);
    expect(Math.round((await first.boundingBox())!.width)).toBe(360);
    expect(
      Math.round(
        (await notice(page, 'NoticeCard · large').boundingBox())!.width
      )
    ).toBe(380);
  });

  test('a large notice card is no wider than a 320px container', async ({
    page,
  }) => {
    await open(page, 'NoticeCard');

    const card = notice(page, 'NoticeCard · large');

    // A block parent: a flex or grid parent would shrink the card by itself.
    await card.evaluate(node => {
      const parent = document.createElement('div');

      parent.style.width = '320px';
      node.replaceWith(parent);
      parent.append(node);
    });

    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(320);
  });

  test('the progress bar fill eases over 0.16s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page, 'ProgressBar');
    await expect(
      state(page, 'ProgressBar · 40').getByRole('progressbar').locator('span')
    ).toHaveCSS('transition-duration', '0.16s');
  });

  test('with reduced motion, the progress bar fill does not ease', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'ProgressBar');
    await expect(
      state(page, 'ProgressBar · 40').getByRole('progressbar').locator('span')
    ).toHaveCSS('transition-duration', '0s');
  });

  test('the callout has 12px padding and the floating shadow', async ({
    page,
  }) => {
    await open(page, 'Callout');

    const callout = state(page, 'Callout · error').getByRole('alert');

    await expect(callout).toHaveCSS('padding', '12px');
    await expect(callout).toHaveCSS('box-shadow', /30px/);
  });

  test('Close and Copy chain keep a 44 x 44px hit area', async ({ page }) => {
    await open(page, 'Popup');

    const popup = state(page, 'Popup · floating');

    for (const name of ['Close', 'Copy chain']) {
      const button = popup.getByRole('button', { name });

      for (const [dx, dy] of [
        [21, 0],
        [-21, 0],
        [0, 21],
        [0, -21],
      ]) {
        expect(
          await hitsControl(button, dx, dy),
          `${name} at ${dx},${dy}`
        ).toBe(true);
      }
    }
  });

  test.describe('a toast rises in', () => {
    const toast = (page: Page) =>
      state(page, 'Toast · success').getByRole('status');

    test('with motion allowed', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await open(page, 'Toast');
      await expect(toast(page)).not.toHaveCSS('animation-name', 'none');
    });

    test('not when reduced motion is on', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, 'Toast');
      await expect(toast(page)).toHaveCSS('animation-name', 'none');
    });
  });
});
