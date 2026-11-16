import { defineConfig } from '@playwright/test';

// Runs only e2e/design-gallery.spec.ts, which opens the files that `npm run design-system` writes
// to .design-system/gallery/. The files hold all they load, so this config starts no app server
// and sets no base URL. `npm run design:gallery` writes the files first, then runs this config.
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [{ name: 'gallery', use: { browserName: 'chromium' } }],
  reporter: [...(process.env.CI ? [['github'] as const] : []), ['list']],
  testDir: '.',
  testMatch: 'design-gallery.spec.ts',
  workers: process.env.CI ? 4 : undefined,
});
