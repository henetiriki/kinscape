import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import screens from '@ks/design/screens.json';

// NFR-05: no screen scrolls sideways at a phone, tablet or small desktop width.

// 320 to 1440, and a phone on its side.
const SIZES = [
  { height: 900, width: 320 },
  { height: 900, width: 375 },
  { height: 900, width: 768 },
  { height: 900, width: 1024 },
  { height: 900, width: 1279 },
  { height: 900, width: 1440 },
  { height: 375, width: 667 },
];

// Its snapshot is a fixed 1440 wide board of one component.
const SKIPPED = new Set(['fuzzy-date-readings']);

const routes = [
  ...new Set(
    screens.screens
      .filter(({ name }) => !SKIPPED.has(name))
      .map(({ route }) => route)
  ),
];

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// A People page scrolls inside its own `main`, so the document stays as wide as the window.
// A `pre` code sample scrolls in its own box by design.
const insideScrollers = (page: Page) =>
  page.evaluate(() =>
    [...document.body.querySelectorAll('*')]
      .filter(
        node =>
          node.tagName !== 'PRE' &&
          ['auto', 'scroll'].includes(getComputedStyle(node).overflowX) &&
          node.scrollWidth > node.clientWidth
      )
      .map(
        node =>
          `${node.tagName.toLowerCase()}.${String(node.getAttribute('class')).split(' ')[0]} by ${node.scrollWidth - node.clientWidth}px`
      )
  );

/** What reaches past the right edge: the elements, with the path to each, and the deepest ones whose content is wider than the screen. */
const reaching = (page: Page) =>
  page.evaluate(() => {
    const edge = window.innerWidth + 0.5;
    const name = (node: Element) =>
      `${node.tagName.toLowerCase()}.${String(node.getAttribute('class')).split(' ')[0]}`;
    const path = (node: Element) => {
      const names: string[] = [];

      for (let up: Element | null = node; up; up = up.parentElement) {
        names.unshift(
          `${name(up)}[${Math.round(up.getBoundingClientRect().width)}]`
        );
      }

      return names.slice(-5).join(' > ');
    };
    const all = [...document.body.querySelectorAll('*')];
    const past = all.filter(
      node =>
        node.getBoundingClientRect().width > 0 &&
        node.getBoundingClientRect().right > edge
    );
    const wider = all.filter(
      node => node.getBoundingClientRect().left + node.scrollWidth > edge
    );

    return [
      ...past
        .filter(node => !past.includes(node.parentElement!))
        .slice(0, 3)
        .map(node => `past: ${path(node)}`),
      ...wider
        .filter(
          node => !wider.some(other => node.contains(other) && other !== node)
        )
        .slice(0, 3)
        .map(node => `wider: ${path(node)} scrollWidth ${node.scrollWidth}`),
    ];
  });

for (const route of routes) {
  test(`${route} does not scroll sideways`, async ({ page }) => {
    // A signed-in visitor never sees the sign-in page.
    if (route.startsWith('/sign-in')) await page.context().clearCookies();

    const wide: string[] = [];

    for (const size of SIZES) {
      await page.setViewportSize(size);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);

      const over = await overflow(page);

      if (over > 0) {
        wide.push(
          `${size.width} × ${size.height}: ${over}px by ${(await reaching(page)).join('; ')}`
        );
      }

      for (const scroller of await insideScrollers(page)) {
        wide.push(`${size.width} × ${size.height}: inside ${scroller}`);
      }
    }

    expect(wide, `${route} scrolls sideways by`).toEqual([]);
  });
}

test.describe('a board at a small desktop width', () => {
  test.use({ viewport: { height: 900, width: 1366 } });

  test('map furniture fits, and its glyph grid is no wider than its board', async ({
    page,
  }) => {
    await page.goto('/design-kit/map-furniture');
    await page.waitForLoadState('networkidle');

    expect(await reaching(page), 'reaching past 1366').toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);

    const { board, grid } = await page.evaluate(() => {
      const glyphs = document.querySelector('[class*="glyphGrid"]')!;
      const right = (node: Element) => node.getBoundingClientRect().right;

      return {
        board: right(glyphs.closest('section') ?? glyphs.parentElement!),
        grid: right(glyphs),
      };
    });

    expect(grid).toBeLessThanOrEqual(board);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { height: 844, width: 375 } });

  test('the "No people yet" card sits between 16px gutters', async ({
    page,
  }) => {
    await page.goto('/screens/people-empty');

    const box = await page
      .getByRole('status')
      .filter({ hasText: 'No people yet' })
      .boundingBox();

    expect(box!.x).toBeCloseTo(16, 0);
    expect(375 - box!.x - box!.width).toBeCloseTo(16, 0);
  });
});
