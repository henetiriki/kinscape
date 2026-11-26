import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

import { openScreen } from '@ks/e2e/design-open';
import { states } from '@ks/e2e/design-states';
import {
  authStateFor,
  changedPixels,
  compare,
  outcomeFor,
  parseConfig,
  unionMask,
} from '@ks/lib/design/check.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

const root = process.cwd();
const config = parseConfig(
  JSON.parse(readFileSync(join(root, 'design/screens.json'), 'utf8')),
  {
    accounts: FIXTURES.map(({ email }) => email),
    snapshots: readdirSync(join(root, 'design/source'))
      .filter(file => file.endsWith('.html'))
      .map(file => file.slice(0, -'.html'.length)),
    states: Object.keys(states),
  }
);

const wanted = process.env.DESIGN_SCREENS?.split(',').filter(Boolean) ?? [];
const unknown = wanted.filter(
  name => !config.screens.some(screen => screen.name === name)
);

if (unknown.length > 0) {
  throw new Error(`DESIGN_SCREENS names no screen: ${unknown.join(', ')}`);
}

// The built page draws its map on a canvas, the snapshot in an svg.
const HIDE_MAP =
  '.maplibregl-canvas, svg[role="img"]:not([aria-hidden="true"]) { visibility: hidden !important; }';

// A built <dialog> draws its text on its own layer, so letter edges differ
// from a snapshot that draws the sheet in the page. Give the snapshot the same.
const LAYER_DIALOGS = '[role="dialog"] { will-change: transform; }';

const shoot = async (page: Page) => PNG.sync.read(await page.screenshot());

/** The screenshot, and the pixels that change when the map is hidden. */
const shootWithMask = async (page: Page) => {
  const shown = await shoot(page);

  await page.addStyleTag({ content: HIDE_MAP });

  const hidden = await shoot(page);

  return { mask: changedPixels(shown.data, hidden.data), shown };
};

const sideBySide = (images: PNG[]) => {
  const out = new PNG({
    height: images[0].height,
    width: images.reduce((sum, image) => sum + image.width, 0),
  });
  let x = 0;

  for (const image of images) {
    PNG.bitblt(image, out, 0, 0, image.width, image.height, x, 0);
    x += image.width;
  }

  return PNG.sync.write(out);
};

for (const screen of config.screens.filter(
  ({ name }) => wanted.length === 0 || wanted.includes(name)
)) {
  test.describe(`design: ${screen.name}`, () => {
    test.use({ storageState: authStateFor(screen.account) });

    test('matches its snapshot', async ({ page }, testInfo) => {
      const { height, width } = screen;

      const out = join(root, 'test-results/design', screen.name);

      mkdirSync(out, { recursive: true });
      await openScreen(page, screen, { height, width });

      if (screen.state) await states[screen.state](page);

      const built = await shootWithMask(page);

      await page.goto(
        pathToFileURL(join(root, 'design/source', `${screen.name}.html`)).href
      );
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: LAYER_DIALOGS });

      const design = await shootWithMask(page);
      const score = compare(
        built.shown.data,
        design.shown.data,
        width,
        unionMask(built.mask, design.mask),
        screen.ignore
      );
      const diff = new PNG({ height, width });

      diff.data = Buffer.from(score.diff);
      writeFileSync(join(out, 'built.png'), PNG.sync.write(built.shown));
      writeFileSync(join(out, 'design.png'), PNG.sync.write(design.shown));
      writeFileSync(join(out, 'diff.png'), PNG.sync.write(diff));
      writeFileSync(
        join(out, 'side-by-side.png'),
        sideBySide([built.shown, design.shown, diff])
      );

      const outcome = outcomeFor(score.percent, config.threshold);

      testInfo.annotations.push({
        description: JSON.stringify({
          differing: score.differing,
          name: screen.name,
          outcome,
          percent: score.percent,
        }),
        type: 'design-result',
      });
      expect(
        outcome,
        `${screen.name}: ${score.percent.toFixed(2)}% of unmasked pixels differ (limit ${config.threshold}%)`
      ).not.toBe('blocked');
    });
  });
}
