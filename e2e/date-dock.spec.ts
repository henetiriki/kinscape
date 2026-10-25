import { expect, type Page, test } from '@playwright/test';

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type TestWindow = {
  kinscapeMap: {
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => { properties: { polity: string } }[];
  };
};

// Fills, not labels: label collision can hide a Polity's name at small viewports.
const drawnPolities = async (page: Page) => {
  await page.waitForFunction(() => 'kinscapeMap' in window);

  return page.evaluate(() => {
    const { kinscapeMap } = window as unknown as TestWindow;

    return new Set(
      kinscapeMap
        .queryRenderedFeatures(undefined, { layers: ['polity-fills'] })
        .map(feature => feature.properties.polity)
    ).size;
  });
};

const slider = (page: Page) => page.getByRole('slider', { name: 'Map date' });

// MAP-03: the Map date starts on today and the eleven Polities are drawn.
test('loads on today with the eleven Polities', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Date shown' })).toHaveValue(
    new Date().toISOString().slice(0, 4)
  );
  await expect.poll(() => drawnPolities(page)).toBe(11);
});

// MAP-04
test('dragging to 1800 and back loads no more boundary data', async ({
  page,
}) => {
  const polityRequests: string[] = [];

  page.on('request', request => {
    if (request.url().includes('/data/polities')) {
      polityRequests.push(request.url());
    }
  });
  await page.goto('/');
  await expect.poll(() => drawnPolities(page)).toBe(11);

  const input = slider(page);
  const max = Number(await input.getAttribute('max'));

  await input.fill('148');
  await expect(page.getByRole('textbox', { name: 'Date shown' })).toHaveValue(
    '1800'
  );
  await expect.poll(() => drawnPolities(page)).toBe(0);
  await input.fill(String(max));
  await expect.poll(() => drawnPolities(page)).toBe(11);
  expect(polityRequests).toHaveLength(1);
});

// MAP-04: 2008-06-01 draws none and 2010-06-01 draws the eleven.
test('draws no Polities before 2009-04-03 and eleven after', async ({
  page,
}) => {
  await page.goto('/');
  // Without this the 0 below passes before the Polities have loaded.
  await expect.poll(() => drawnPolities(page)).toBe(11);
  await page.getByRole('radio', { name: 'Day' }).click();

  const input = slider(page);
  const epoch = Date.UTC(1652, 0, 1);
  const dayOf = (iso: string) => (Date.parse(iso) - epoch) / 86_400_000;

  await input.fill(String(dayOf('2008-06-01')));
  await expect.poll(() => drawnPolities(page)).toBe(0);
  await input.fill(String(dayOf('2010-06-01')));
  await expect.poll(() => drawnPolities(page)).toBe(11);
});

// NFR-01: 20 steps across 2009-04-03, each redraw under 2500 ms (software WebGL on CI).
test(
  'each redraw across 2009-04-03 stays under 2500 ms',
  { tag: '@perf' },
  async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'Day' }).click();
    await expect.poll(() => drawnPolities(page)).toBe(11);

    const input = slider(page);
    const epoch = Date.UTC(1652, 0, 1);
    const start = (Date.parse('2009-03-24') - epoch) / 86_400_000;
    const times: number[] = [];

    for (let step = 0; step < 20; step++) {
      await input.fill(String(start + step));
      await page.waitForFunction(
        count =>
          performance.getEntriesByName('map-date-redraw').length >= count,
        times.length + 1
      );
      times.push(
        await page.evaluate(
          () => performance.getEntriesByName('map-date-redraw').at(-1)!.duration
        )
      );
    }

    console.log('redraw ms', times.map(t => Math.round(t)).join(' '));
    expect(Math.max(...times)).toBeLessThan(2500);
  }
);

// MAP-03
test('the step buttons stop at today', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Forward' })).toBeDisabled();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Forward' })).toBeEnabled();
});

// MAP-03: typing 1800 moves the slider there and no Polities are drawn.
test('typing 1800 moves the slider and draws no Polities', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => drawnPolities(page)).toBe(11);

  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill('1800');
  await field.press('Enter');
  await expect(slider(page)).toHaveValue('148');
  await expect.poll(() => drawnPolities(page)).toBe(0);
});

// MAP-03 (M1.5.4 D1 A): the error callout sits 12px above the dock, 340px wide from the Back button.
test('an invalid date opens its callout above the dock, 340px wide', async ({
  page,
}) => {
  await page.goto('/');

  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill('1901-02-30');
  await field.press('Enter');
  await expect(field).toHaveAttribute('aria-invalid', 'true');

  const callout = page.getByRole('alert').filter({ hasText: 'has 28 days' });
  const dock = page.getByRole('region', { name: 'Map date' });
  const calloutBox = (await callout.boundingBox())!;
  const dockBox = (await dock.boundingBox())!;
  const back = (await page
    .getByRole('button', { name: 'Back' })
    .boundingBox())!;

  expect(calloutBox.y + calloutBox.height).toBeCloseTo(dockBox.y - 12, 0);
  expect(calloutBox.x).toBeCloseTo(back.x, 0);
  expect(calloutBox.width).toBeCloseTo(340, 0);
});

// MAP-03: typing a month on Year switches precision and says so.
test('typing 1901-06 on Year switches to Month with a note', async ({
  page,
}) => {
  await page.goto('/');

  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill('1901-06');
  await field.press('Enter');
  await expect(page.getByRole('radio', { name: 'Month' })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText(
    'Switched to month precision.'
  );
});

// B280, MAP-03, NFR-06: Esc restores the last good date after Tab leaves the field.
test('Esc after Tab restores the date and clears the error', async ({
  page,
}) => {
  await page.goto('/');

  const field = page.getByRole('textbox', { name: 'Date shown' });
  const good = await field.inputValue();

  await field.fill('1650');
  await field.press('Tab');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Escape');
  await expect(field).toHaveValue(good);
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
});

// NFR-06: Precision is one Tab stop and the arrow keys move the choice (DM.4.5 D2 A).
test('keyboard: Space on the checkbox, Tab order, arrows in Precision', async ({
  page,
}) => {
  await page.goto('/');

  const polities = page.getByRole('checkbox', { name: 'Polity borders' });

  await polities.focus();
  await page.keyboard.press('Space');
  await expect(polities).not.toBeChecked();
  await page.keyboard.press('Space');
  await expect(polities).toBeChecked();

  await page.getByRole('button', { name: 'Back' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Date shown' })).toBeFocused();
  // Forward is disabled on today, so the next stop is the Precision group.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'Year' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Month' })).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('slider', { name: 'Map date' })).toBeFocused();
});
