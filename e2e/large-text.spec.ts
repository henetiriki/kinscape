import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { openScreen, wantedScreens } from '@ks/e2e/design-open';
import { DESKTOP_ONLY, states } from '@ks/e2e/design-states';
import { cutOffNow, LARGE_TEXT } from '@ks/e2e/large-text';
import { wideNow } from '@ks/e2e/sideways';
import { authStateFor, parseConfig } from '@ks/lib/design/check.mts';
import { SIZES, verdictFor } from '@ks/lib/design/large-text.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

// NFR-05, NFR-06: each screen holds at 200% root text size, except the entries of the list.
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
const list = JSON.parse(
  readFileSync(join(root, 'lib/design/large-text.json'), 'utf8')
);

for (const screen of wantedScreens(config.screens)) {
  test.describe(`large text: ${screen.name}`, () => {
    test.use({ storageState: authStateFor(screen.account) });

    const sizes =
      screen.state && DESKTOP_ONLY.has(screen.state) ? [SIZES[0]] : SIZES;

    for (const size of sizes) {
      test(`large text: ${screen.name} at ${size.width}`, async ({ page }) => {
        await page.addInitScript(LARGE_TEXT);

        const problems: string[] = [];

        await openScreen(page, screen, size);

        // A step that cannot run at this size, for example a desktop click at 390px, fails fast
        // and leaves time for the checks below.
        page.setDefaultTimeout(10_000);

        try {
          if (screen.state) await states[screen.state](page);
        } catch (error) {
          problems.push(
            `the state step failed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`
          );
        }

        problems.push(
          ...(await wideNow(page, size)),
          ...(await cutOffNow(page))
        );

        const result = verdictFor(screen.name, size.width, problems, list);

        expect(result.ok, result.text).toBe(true);
      });
    }
  });
}

test('large text: each desktop-only name is a key of states', () => {
  expect(
    [...DESKTOP_ONLY].filter(name => !Object.hasOwn(states, name))
  ).toEqual([]);
});

test.describe('large text: the rule', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('finds each kind of problem and passes the rest', async ({ page }) => {
    await page.addInitScript(LARGE_TEXT);
    await page.setViewportSize(SIZES[0]);
    await page.goto('/sign-in');
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).fontSize
      )
    ).toBe('32px');
    await page.evaluate(() => {
      const long = 'Wide text that does not fit its small box at all';
      const add = (html: string) =>
        document.body.insertAdjacentHTML('beforeend', html);

      add(`
        <div id="ks-rule">
          <div class="k-hidden" style="width:40px;overflow:hidden;white-space:nowrap">${long}</div>
          <div class="k-clip" style="width:40px;overflow:clip;white-space:nowrap">${long}</div>
          <div class="k-ellipsis" style="width:40px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${long}</div>
          <div class="k-parent" style="width:40px;overflow:hidden"><span class="k-child" style="display:inline-block;white-space:nowrap">${long}</span></div>
          <div class="k-mixed" style="width:200px;overflow:hidden">Born <span style="display:inline-block;white-space:nowrap">${long}</span> in 1820</div>
          <div class="k-tiny" style="width:1px;height:1px;overflow:hidden;white-space:nowrap">${long}</div>
          <div class="k-gone" style="display:none;width:40px;overflow:hidden;white-space:nowrap">${long}</div>
          <div class="k-fits" style="width:900px;overflow:hidden;white-space:nowrap">Fits</div>
          <div class="k-inner" style="width:40px;overflow:auto;white-space:nowrap">${long}</div>
          <pre class="k-pre" style="width:40px;overflow:auto">${long}</pre>
        </div>`);
    });

    const cut = await cutOffNow(page);
    const names = cut.map(problem => problem.split(':')[0]);

    expect(names).toEqual(
      expect.arrayContaining(['div.k-hidden', 'div.k-clip', 'div.k-ellipsis'])
    );
    expect(names).not.toContain('div.k-parent');
    expect(names).not.toContain('div.k-mixed');
    expect(names).not.toContain('div.k-tiny');
    expect(names).not.toContain('div.k-gone');
    expect(names).not.toContain('div.k-fits');
    expect(names).not.toContain('div.k-inner');

    const wide = (await wideNow(page, SIZES[0])).join('\n');

    expect(wide).toContain('inside div.k-inner');
    expect(wide).not.toContain('k-pre');

    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<div style="width:3000px;height:4px"></div>'
      );
    });
    expect((await wideNow(page, SIZES[0])).join('\n')).toMatch(
      /1440 × 900: \d+px by/
    );
  });
});
