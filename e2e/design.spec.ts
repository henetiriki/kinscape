import { expect, test } from '@playwright/test';

import tokens from '@ks/design/tokens.json' with { type: 'json' };

// NFR-03: fonts are fetched at build time, so no browser request leaves KinScape.
test('no request goes to a Google domain, and text renders in Public Sans', async ({
  page,
}) => {
  const external: string[] = [];

  page.on('request', request => {
    if (/google|gstatic/i.test(new URL(request.url()).hostname)) {
      external.push(request.url());
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(external).toEqual([]);
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;

      // next/font names the family after its const.
      return document.fonts.check("15px 'publicSans'");
    })
  ).toBe(true);
  await expect(page.locator('body')).toHaveCSS(
    'font-family',
    /Public Sans|publicSans/i
  );
});

// NFR-06: the 2px brand outline, 2px outside each control the keyboard reaches.
test('keyboard focus shows a 2px brand outline offset 2px', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const seen = new Set<string>();

  for (let step = 0; step < 12; step += 1) {
    const outline = await page.evaluate(() => {
      const active = document.activeElement!;
      // A Segmented radio is hidden; its label draws the ring.
      const ringed =
        active instanceof HTMLInputElement && active.type === 'radio'
          ? active.parentElement!
          : active;
      const style = getComputedStyle(ringed);
      const tag = active.tagName + '.' + active.className;

      // A text field has no ring: its box takes a 2px brand border.
      if (active instanceof HTMLInputElement && active.type === 'text') {
        const box = getComputedStyle(active.parentElement!);

        return {
          mark: {
            colour: box.borderTopColor,
            outline: style.outlineStyle,
            style: box.borderTopStyle,
            width: box.borderTopWidth,
          },
          tag,
        };
      }

      return {
        mark: {
          colour: style.outlineColor,
          offset: style.outlineOffset,
          width: style.outlineWidth,
        },
        tag,
      };
    });

    if (!outline.tag.startsWith('BODY') && !outline.tag.includes('CANVAS')) {
      expect(outline.mark, outline.tag).toEqual(
        'offset' in outline.mark
          ? { colour: 'rgb(38, 79, 41)', offset: '2px', width: '2px' }
          : {
              colour: 'rgb(38, 79, 41)',
              outline: 'none',
              style: 'solid',
              width: '2px',
            }
      );
      seen.add(outline.tag);
    }

    await page.keyboard.press('Tab');
  }

  expect(seen.size).toBeGreaterThan(0);
});

// Changing `brand` changes the checked checkbox with no other edit.
test('the checkbox uses the brand colour', async ({ page }) => {
  await page.goto('/');

  const brand = tokens.colour.brand;
  const [r, g, b] = [1, 3, 5].map(i =>
    Number.parseInt(brand.slice(i, i + 2), 16)
  );

  await expect(
    page.getByRole('checkbox', { name: 'Polity borders' })
  ).toHaveCSS('background-color', `rgb(${r}, ${g}, ${b})`);
});
