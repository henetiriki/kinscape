import { expect, type Page, test } from '@playwright/test';

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type TestWindow = {
  kinscapeMap: {
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => { properties: { name: string } }[];
  };
};

const drawnLabels = (page: Page) =>
  page.evaluate(() => {
    const { kinscapeMap } = window as unknown as TestWindow;

    return new Set(
      kinscapeMap
        .queryRenderedFeatures(undefined, { layers: ['polity-labels'] })
        .map(feature => feature.properties.name)
    ).size;
  });

const slider = (page: Page) => page.getByRole('slider', { name: 'Map date' });

// MAP-03: the Map date starts on today and the eleven Polities are drawn.
test('loads on today with the eleven Polities', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Date shown' })).toHaveValue(
    new Date().toISOString().slice(0, 4)
  );
  await expect.poll(() => drawnLabels(page)).toBe(11);
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
  await expect.poll(() => drawnLabels(page)).toBe(11);

  const input = slider(page);
  const max = Number(await input.getAttribute('max'));

  await input.fill('148');
  await expect(page.getByRole('status')).toContainText('1800-');
  await expect.poll(() => drawnLabels(page)).toBe(0);
  await input.fill(String(max));
  await expect.poll(() => drawnLabels(page)).toBe(11);
  expect(polityRequests).toHaveLength(1);
});

// MAP-04: 2008-06-01 draws none and 2010-06-01 draws the eleven.
test('draws no Polities before 2009-04-03 and eleven after', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Day' }).click();

  const input = slider(page);
  const epoch = Date.UTC(1652, 0, 1);
  const dayOf = (iso: string) => (Date.parse(iso) - epoch) / 86_400_000;

  await input.fill(String(dayOf('2008-06-01')));
  await expect.poll(() => drawnLabels(page)).toBe(0);
  await input.fill(String(dayOf('2010-06-01')));
  await expect.poll(() => drawnLabels(page)).toBe(11);
});

// NFR-01: 20 steps across 2009-04-03, each redraw under 250 ms (software WebGL on CI).
test('each redraw across 2009-04-03 stays under 250 ms', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Day' }).click();
  await expect.poll(() => drawnLabels(page)).toBe(11);

  const input = slider(page);
  const epoch = Date.UTC(1652, 0, 1);
  const start = (Date.parse('2009-03-24') - epoch) / 86_400_000;
  const times: number[] = [];

  for (let step = 0; step < 20; step++) {
    await input.fill(String(start + step));
    await page.waitForFunction(
      count => performance.getEntriesByName('map-date-redraw').length >= count,
      times.length + 1
    );
    times.push(
      await page.evaluate(
        () => performance.getEntriesByName('map-date-redraw').at(-1)!.duration
      )
    );
  }

  console.log('redraw ms', times.map(t => Math.round(t)).join(' '));
  expect(Math.max(...times)).toBeLessThan(250);
});

// MAP-03
test('the step buttons stop at today', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Forward' })).toBeDisabled();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Forward' })).toBeEnabled();
});
