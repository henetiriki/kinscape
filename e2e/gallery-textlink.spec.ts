import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { GALLERY, OUTPUT } from '@ks/lib/design/cards.mts';

// NFR-05, NFR-06: a link that wraps keeps a 44px hit area on each of its lines. Like e2e/gallery-looks.spec.ts,
// the test opens a gallery file from disk, with no app.

test('each line of a wrapped small link has a 44px hit area', async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 390 });
  await page.goto(
    pathToFileURL(join(process.cwd(), OUTPUT, GALLERY, 'TextLink.html')).href
  );

  const link = page
    .getByRole('figure', { exact: true, name: 'TextLink · wrapped' })
    .getByRole('link');
  const lines = await link.evaluate(node =>
    [...node.getClientRects()].map(rect => ({
      height: Math.round(rect.height),
      // A point 21px above and below the middle of the line is on the link.
      hits: [-21, 21].map(dy => {
        const hit = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2 + dy
        );

        return hit !== null && node.contains(hit);
      }),
    }))
  );

  expect(lines.length, 'the link wraps to two lines').toBe(2);
  expect(lines, 'a line of 44px hit area, above and below').toEqual(
    lines.map(({ height }) => ({ height, hits: [true, true] }))
  );
});
