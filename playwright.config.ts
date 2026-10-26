import type { PlaywrightWorkerOptions } from '@playwright/test';

import { defineConfig } from '@playwright/test';

// How the browser is launched. Every project below uses this one object, so
// all of them run the same Chromium the same way. The top-level `use` further down
// (the base URL) applies to every project too; a project's own `use` is added on top.
const use: Partial<PlaywrightWorkerOptions> = {
  browserName: 'chromium',
  // Headless Chromium has no GPU; MapLibre needs software WebGL.
  launchOptions: {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
};

export default defineConfig({
  // Run the tests inside one file side by side too, not only different files.
  fullyParallel: true,
  // A project is a named group of tests. Each picks its tests with a filter, and all
  // three use the same browser settings (`use`) above.
  projects: [
    // The everyday checks: every spec file except the design check, and every test
    // except the ones tagged @perf (those get their own project below).
    {
      grepInvert: /@perf/,
      name: 'chromium',
      testIgnore: 'design-check.spec.ts',
      use,
    },
    // The design check: only design-check.spec.ts, which compares each built screen
    // with its design snapshot. It is separate so `npm run design:check` can run it
    // alone with `--project=design`.
    { name: 'design', testMatch: 'design-check.spec.ts', use },
    // The timing tests, tagged @perf. They measure how fast the map redraws, so they
    // run alone, after the two projects above finish (`dependencies`), and other
    // workers don't slow them. If either dependency fails, this one is skipped.
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
  // Applies to every project: `page.goto('/')` means the local app below.
  use: { baseURL: 'http://localhost:3000' },
  // Builds and starts the app before the tests. Locally an app already running on
  // that URL is reused; in CI a fresh build is always made.
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
