import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import type * as samples from '#ks/lib/design/samples.mts';

import {
  defineBuilder,
  designSystem,
  fillTemplate,
  inlineStyles,
  mountImports,
  pageHtml,
  prepare,
  snapshotProblems,
  tokenColours,
} from '#ks/scripts/design-export.mts';

// DS.8: a board that uses the design system exports as rendered HTML with every value written out.

const root = process.cwd();
// The Playwright config loads the samples' imports as CommonJS, so an `import` of the samples here fails.
const { CONTESTED_COUNT, CONTESTED_YEARS, EPOCHS, MAP_DATE, TODAY } =
  createRequire(import.meta.url)(
    '#ks/lib/design/samples.mts'
  ) as typeof samples;
const url = (path: string) => pathToFileURL(join(root, path)).href;

/** A canvas board: `body` is its template and `vals` is what its script returns. */
const board = (body: string, vals: string): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Test board</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="ds/kinscape/tokens.css">
<link rel="stylesheet" href="ds/kinscape/components/bundle.css">
<script src="ds/kinscape/components/bundle.js"></script>
</head><body><x-dc>
${body}</x-dc>
<script type="text/x-dc" data-dc-script>class Component extends DCLogic { renderVals() { return ${vals}; } }</script>
</body></html>`;

const BOARD = board(
  `<div style="padding: var(--space-16); background: var(--surface); width: calc(var(--space-16) * 10)">
  <h2 class="h2" style="margin: 0">Add a pin</h2>
  <x-import component-from-global-scope="KinScape.TextField" label="Person" default-value="Example Person"></x-import>
  <x-import component-from-global-scope="KinScape.Button" variant="primary" style="flex: 1">Save pin</x-import>
  <x-import component-from-global-scope="KinScape.Alert" tone="warning" title="Heads up">Careful.</x-import>
  <x-import component-from-global-scope="KinScape.Banner" icon="cloudOff" action="Retry">You are offline.</x-import>
  <x-import component-from-global-scope="KinScape.Segmented" label="View" name="view" value="map" options="{{ segments }}"></x-import>
</div>`,
  "{ segments: [{ label: 'Map', value: 'map' }, { label: 'List', value: 'list', state: 'hover' }] }"
);

const tokens = tokenColours(
  readFileSync(join(root, 'design/tokens.json'), 'utf8')
);

/** The snapshot of a board, made by the steps of the exporter. */
const exportBoard = async (page: Page, board: string): Promise<string> => {
  const dir = mkdtempSync(join(tmpdir(), 'design-export-e2e-'));

  try {
    const file = join(dir, 'board.html');

    writeFileSync(
      file,
      prepare(board, '/_blob/icon', {
        fonts: url('design/source/fonts.css'),
        icon: url('app/icon0.svg'),
        system: designSystem(root),
      })
    );
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(fillTemplate, { props: {}, state: {} });
    await page.evaluate(defineBuilder);
    await page.evaluate(mountImports);
    await page.evaluate(inlineStyles, [...tokens]);

    return await page.evaluate(pageHtml);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

test('exports a board that uses <x-import> and var() as rendered HTML with written-out values', async ({
  page,
}) => {
  const snapshot = await exportBoard(page, BOARD);

  expect(snapshotProblems(snapshot, tokens)).toEqual([]);
  expect(snapshot).toContain('<input');
  expect(snapshot).toContain('Example Person');
  expect(snapshot).toMatch(/<div style="flex: 1[^"]*"><button/);
  expect(snapshot).toContain('Save pin');
  expect(snapshot).toContain('Careful.');
  // Banner and a hovered Segmented item use the white-45 and white-60 tokens, which
  // Chromium computes as rgba(); color-mix() would have left color(srgb …).
  expect(snapshot).toContain('You are offline.');
  expect(snapshot).toContain('rgba(255, 255, 255, 0.45)');
  expect(snapshot).toContain('rgba(255, 255, 255, 0.6)');
  expect(snapshot).toContain('width: 160px');
  // A text style the board takes from tokens.css by class, which has no link left in the snapshot.
  expect(snapshot).toMatch(/<h2 class="h2" style="[^"]*line-height: 32px/);
});

// BND-04: the contested hatch is an rgba() colour, so a board can mount the DateDock and the Legend.
test('exports a board that mounts the DateDock with contested claims and epochs', async ({
  page,
}) => {
  const snapshot = await exportBoard(
    page,
    board(
      '<x-import component-from-global-scope="KinScape.DateDock" day="{{ day }}" last-day="{{ lastDay }}" epochs="{{ epochs }}" contested-count="{{ contestedCount }}" contested-years="{{ contestedYears }}"></x-import>',
      JSON.stringify({
        contestedCount: CONTESTED_COUNT,
        contestedYears: CONTESTED_YEARS,
        day: MAP_DATE,
        epochs: EPOCHS,
        lastDay: TODAY,
      })
    )
  );

  expect(snapshotProblems(snapshot, tokens)).toEqual([]);
  expect(snapshot).toContain('2 contested claims on this date');
  expect(snapshot).toContain('rgba(139, 74, 28, 0.34)');
});

test('exports a board that mounts the Legend', async ({ page }) => {
  const snapshot = await exportBoard(
    page,
    board(
      '<x-import component-from-global-scope="KinScape.Legend"></x-import>',
      '{}'
    )
  );

  expect(snapshotProblems(snapshot, tokens)).toEqual([]);
  expect(snapshot).toContain('Contested claim');
  expect(snapshot).toContain('rgba(139, 74, 28, 0.34)');
});
