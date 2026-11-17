import { expect, test } from '@playwright/test';

// Temporary (plan B970, step 7): fails once in CI, so the e2e job uploads `e2e-failures`.
test('fails to prove the failure upload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('b970-missing')).toBeVisible({ timeout: 1000 });
});
