import { defineConfig } from '@playwright/test';

import { CARD_IMAGES, pinnedImage } from '@ks/lib/design/cards.mts';
import { LAUNCH_ARGS } from '@ks/lib/design/shots.mts';

// The main config loads the spec too, so the config of the gallery prints this, not the spec.
// Each worker loads this config again and has a TEST_WORKER_INDEX: only the runner prints.
if (!pinnedImage(process.env) && process.env.TEST_WORKER_INDEX === undefined) {
  console.log(
    'Card images: skipped. Another machine draws text differently. The design job and "Design: Render snapshots" compare them.'
  );
}

// Runs only e2e/design-gallery.spec.ts, which opens the files that `npm run design-system` writes
// to .design-system/gallery/. The files hold all they load, so this config starts no app server
// and sets no base URL. `npm run design:gallery` writes the files first, then runs this config.
// The card images are the baselines of the screenshot assertion: `--update-snapshots` writes them.
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'gallery',
      use: { browserName: 'chromium', launchOptions: { args: LAUNCH_ARGS } },
    },
  ],
  reporter: [...(process.env.CI ? [['github'] as const] : []), ['list']],
  // `{testDir}` is e2e/, so the template goes up one folder to reach CARD_IMAGES.
  snapshotPathTemplate: `{testDir}/../${CARD_IMAGES}/{arg}{ext}`,
  testDir: '.',
  testMatch: 'design-gallery.spec.ts',
  workers: process.env.CI ? 4 : undefined,
});
