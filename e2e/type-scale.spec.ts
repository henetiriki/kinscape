import { expect, test } from '@playwright/test';

// The page title is "Sign in", visible without a session.
test.use({ storageState: { cookies: [], origins: [] } });

// NFR-06: the major third scale. The page title is step 700 on a phone and step 800 on a desktop.
for (const [name, width, height, size] of [
  ['a phone', 390, 844, '31px'],
  ['a desktop', 1440, 900, '39px'],
] as const) {
  test(`the page title is ${size} on ${name}`, async ({ page }) => {
    await page.setViewportSize({ height, width });
    await page.goto('/sign-in');

    await expect(
      page.getByRole('heading', { exact: true, level: 1, name: 'Sign in' })
    ).toHaveCSS('font-size', size);
  });
}
