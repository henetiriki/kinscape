import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CARD_WIDTHS,
  cardImage,
  GALLERY,
  OUTPUT,
  pinnedImage,
} from '@ks/lib/design/cards.mts';
import { CARDS } from '@ks/lib/design/states.mts';

// Each component card opens from disk, with no app and no network, at a desktop and at a phone width.
// In the pinned Playwright image, its full page also matches its card image in design/cards/.
// `npm run design-system` writes the gallery files (`design:gallery` runs it first).

const gallery = join(process.cwd(), OUTPUT, GALLERY);
// e2e/gallery.config.ts prints one line where this is false.
const compare = pinnedImage(process.env);

for (const { name, states } of CARDS) {
  for (const width of CARD_WIDTHS) {
    test(`${name} at ${width}px shows each state and reports no error`, async ({
      page,
    }) => {
      const problems: string[] = [];

      page.on('console', message => {
        if (message.type() === 'error') {
          problems.push(`console error: ${message.text()}`);
        }
      });
      page.on('pageerror', error => {
        problems.push(`page error: ${error.message}`);
      });
      page.on('request', request => {
        if (/^https?:/.test(request.url())) {
          problems.push(`network request: ${request.url()}`);
        }
      });
      await page.setViewportSize({ height: 900, width });
      await page.goto(pathToFileURL(join(gallery, `${name}.html`)).href);

      await expect(page.locator('figure.ks-case')).toHaveCount(states.length);
      expect(problems).toEqual([]);

      if (compare) {
        await expect(page).toHaveScreenshot(cardImage(name, width), {
          fullPage: true,
        });
      }
    });
  }
}
