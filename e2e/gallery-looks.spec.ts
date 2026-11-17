import type { Locator, Page } from '@playwright/test';

import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { hitsControl } from '@ks/e2e/hits';
import { GALLERY, OUTPUT } from '@ks/lib/design/cards.mts';

// NFR-05, NFR-06: the look of the shared controls, read from the gallery files in
// .design-system/gallery/. Like e2e/design-gallery.spec.ts, each test opens files from disk, with no app.
// No test compares an image, so each runs on any machine, not only in the pinned image.

const gallery = join(process.cwd(), OUTPUT, GALLERY);

const open = (page: Page, name: string) =>
  page.goto(pathToFileURL(join(gallery, `${name}.html`)).href);

// A case is a figure that its caption names.
const state = (page: Page, label: string) =>
  page.getByRole('figure', { exact: true, name: label });

// Each control in one card state: the file, the figure, the role and the name.
const HIT_CASES = [
  ['Checkbox', 'Checkbox off · default', 'checkbox', 'Deceased'],
  ['Chip', 'Chip · default', 'button', 'Birth'],
  ['Segmented', 'Segmented · default', undefined, 'List'],
  ['Tabs', 'Tabs · default', 'tab', 'Filters'],
  ['IconButton', 'IconButton · default', 'button', 'Zoom in'],
] as const;

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

  test('a checkbox, chip, segment, tab and icon button each have a 44 x 44px hit area', async ({
    page,
  }) => {
    await expectHitAreas(page, HIT_CASES);
  });

  test('a notice card is no wider than the screen less the gutters, has 44px buttons, and nothing scrolls sideways', async ({
    page,
  }) => {
    await open(page, 'NoticeCard');

    const card = state(page, 'NoticeCard · one action').getByRole('status');

    expect(Math.round((await card.boundingBox())!.width)).toBeLessThanOrEqual(
      390 - 32
    );
    expect(
      Math.round((await card.getByRole('button').first().boundingBox())!.height)
    ).toBe(44);
    // The large card is a fixed 380 wide, so the whole file can scroll. The figure of this card must not.
    expect(
      await state(page, 'NoticeCard · one action').evaluate(
        node =>
          node.scrollWidth <= node.clientWidth &&
          node.getBoundingClientRect().right <= window.innerWidth
      )
    ).toBe(true);
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

      // A radio group is one tab stop, and the cards of Segmented share one group.
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
            new Set(radios.map(radio => radio.name)).size
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
