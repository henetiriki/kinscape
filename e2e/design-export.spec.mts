import { expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  designSystem,
  fillTemplate,
  inlineStyles,
  mountImports,
  pageHtml,
  prepare,
  snapshotProblems,
  tokenColours,
} from '../scripts/design-export.mts';

// DS.8: a board that uses the design system exports as rendered HTML with every value written out.

const root = process.cwd();
const url = (path: string) => pathToFileURL(join(root, path)).href;

const BOARD = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Test board</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="ds/kinscape/tokens.css">
<link rel="stylesheet" href="ds/kinscape/components/bundle.css">
<script src="ds/kinscape/components/bundle.js"></script>
</head><body><x-dc>
<div style="padding: var(--space-16); background: var(--surface); width: calc(var(--space-16) * 10)">
  <h2 class="h2" style="margin: 0">Add a pin</h2>
  <x-import component-from-global-scope="KinScape.TextField" label="Person" default-value="Example Person"></x-import>
  <x-import component-from-global-scope="KinScape.Button" variant="primary" style="flex: 1">Save pin</x-import>
  <x-import component-from-global-scope="KinScape.Alert" tone="warning" title="Heads up">Careful.</x-import>
</div></x-dc>
<script type="text/x-dc" data-dc-script>class Component extends DCLogic { renderVals() { return {}; } }</script>
</body></html>`;

test('exports a board that uses <x-import> and var() as rendered HTML with written-out values', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'design-export-e2e-'));

  try {
    const file = join(dir, 'board.html');

    writeFileSync(
      file,
      prepare(BOARD, '/_blob/icon', {
        fonts: url('design/source/fonts.css'),
        icon: url('app/icon0.svg'),
        system: designSystem(root),
      })
    );
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(fillTemplate, { props: {}, state: {} });
    await page.evaluate(mountImports);
    await page.evaluate(inlineStyles);

    const snapshot = await page.evaluate(pageHtml);

    expect(
      snapshotProblems(
        snapshot,
        tokenColours(readFileSync(join(root, 'design/tokens.json'), 'utf8'))
      )
    ).toEqual([]);
    expect(snapshot).toContain('<input');
    expect(snapshot).toContain('Example Person');
    expect(snapshot).toMatch(/<div style="flex: 1[^"]*"><button/);
    expect(snapshot).toContain('Save pin');
    expect(snapshot).toContain('Careful.');
    expect(snapshot).toContain('width: 160px');
    // A text style the board takes from tokens.css by class, which has no link left in the snapshot.
    expect(snapshot).toMatch(/<h2 class="h2" style="[^"]*line-height: 32px/);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
