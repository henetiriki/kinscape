import { expect, test } from '@playwright/test';

import { fixtureStateFor } from '@ks/lib/design/check.mts';
import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

const [researcher] = FIXTURES;
const failing = FIXTURES.find(
  ({ email }) => email === 'r.failing@example.com'
)!;

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type TestWindow = {
  kinscapeMap: {
    hasImage: (id: string) => boolean;
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => unknown[];
    querySourceFeatures: (source: string) => unknown[];
  };
};

// One synthetic Pin of each Event type, each at its own position and shown from 1797 on.
const EACH_TYPE = EVENT_TYPES.map((eventType, index) => ({
  eventType,
  id: `01900000-0000-7000-b000-00000000000${index}`,
  latitude: -33 + index * 0.6,
  longitude: 20 + index * 0.9,
  span: { validFrom: 53_000, validTo: null },
}));

test.describe('the researcher Tree with a Pin of each Event type', () => {
  test.use({ storageState: fixtureStateFor(researcher.email) });

  // PIN-03: the Tree has no Pins of its own, so the response is the test's own.
  test('draws each Event type as an SDF image on the map', async ({ page }) => {
    await page.route('**/data/pins', route =>
      route.fulfill({ json: EACH_TYPE })
    );
    await page.goto('/');
    await expect(page.getByText('10 of 10 true on this date')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as TestWindow).kinscapeMap.queryRenderedFeatures(
              undefined,
              { layers: ['pins'] }
            ).length
        )
      )
      .toBe(EVENT_TYPES.length);

    for (const eventType of EVENT_TYPES) {
      expect(
        await page.evaluate(
          id => (window as unknown as TestWindow).kinscapeMap.hasImage(id),
          `pin-${eventType}`
        )
      ).toBe(true);
    }
  });
});

test.describe('the Account whose Pins fail to load', () => {
  test.use({ storageState: fixtureStateFor(failing.email) });

  // PIN-03: an error toast offers a retry and sits above the dock.
  test('shows the error toast above the dock, and Esc hides it', async ({
    page,
  }) => {
    await page.goto('/');

    const toast = page.getByRole('alert').filter({ hasText: 'did not load' });
    const retry = toast.getByRole('button', { name: 'Try again' });

    await expect(toast).toContainText('Your pins did not load.');
    await expect(retry).toBeVisible();

    const toastBox = (await toast.boundingBox())!;
    const dockBox = (await page
      .getByRole('region', { name: 'Map date' })
      .boundingBox())!;

    expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(dockBox.y);
    await retry.focus();
    await page.keyboard.press('Escape');
    await expect(toast).toHaveCount(0);
  });
});

test.describe('the researcher Tree, which has no Pins', () => {
  test.use({ storageState: fixtureStateFor(researcher.email) });

  // PIN-03: no Pin and no error.
  test('shows no Pin, no error and "0 of 0 true on this date"', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForFunction(() => 'kinscapeMap' in window);
    await expect(page.getByText('0 of 0 true on this date')).toBeVisible();
    // Next.js keeps an empty alert for route changes, so the check names the message.
    await expect(page.getByText('Your pins did not load.')).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'Pins' })).toBeChecked();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as TestWindow).kinscapeMap.querySourceFeatures(
            'pins'
          ).length
      )
    ).toBe(0);
  });
});
