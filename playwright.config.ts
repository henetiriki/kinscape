import { defineConfig, type PlaywrightWorkerOptions } from '@playwright/test';

const use: Partial<PlaywrightWorkerOptions> = {
  browserName: 'chromium',
  // Headless Chromium has no GPU; MapLibre needs software WebGL.
  launchOptions: {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
};

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      grepInvert: /@perf/,
      name: 'chromium',
      testIgnore: 'design-check.spec.ts',
      use,
    },
    { name: 'design', testMatch: 'design-check.spec.ts', use },
    // Timing tests run alone, after the rest, so other workers don't slow them.
    {
      dependencies: ['chromium', 'design'],
      grep: /@perf/,
      name: 'perf',
      use,
    },
  ],
  reporter: [
    ...(process.env.CI ? [['github'] as const] : []),
    ['list'],
    ['./e2e/design-reporter.ts'],
  ],
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run build && npm run start',
    env: { NEXT_PUBLIC_E2E: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: 'http://localhost:3000',
  },
  // The CI runner has 2 cores; elsewhere Playwright picks.
  workers: process.env.CI ? 2 : undefined,
});
