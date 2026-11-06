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

// Where e2e/auth.setup.ts saves the signed-in session.
const signedIn = 'test-results/.auth/state.json';

export default defineConfig({
  // A stray `test.only` fails the run in CI instead of quietly running one test.
  forbidOnly: !!process.env.CI,
  // Run the tests inside one file side by side too, not only different files.
  fullyParallel: true,
  // A project is a named group of tests. Each picks its tests with a filter, and all
  // three use the same browser settings (`use`) above.
  projects: [
    // Signs in once through the form and saves the session; the projects below load it.
    { name: 'setup', testMatch: 'auth.setup.ts', use },
    // The everyday checks: every spec file except the design check, and every test
    // except the ones tagged @perf (those get their own project below).
    {
      dependencies: ['setup'],
      grepInvert: /@perf/,
      name: 'chromium',
      testIgnore: ['auth.setup.ts', 'design-check.spec.ts'],
      use: { ...use, storageState: signedIn },
    },
    // The design check: only design-check.spec.ts, which compares each built screen
    // with its design snapshot. It is separate so `npm run design:check` can run it
    // alone with `--project=design`.
    {
      dependencies: ['setup'],
      name: 'design',
      testMatch: 'design-check.spec.ts',
      use: { ...use, storageState: signedIn },
    },
    // The timing tests, tagged @perf. They measure how fast the map redraws, so they
    // run alone, after the two projects above finish (`dependencies`), and other
    // workers don't slow them. If either dependency fails, this one is skipped.
    {
      dependencies: ['chromium', 'design'],
      grep: /@perf/,
      name: 'perf',
      testIgnore: 'auth.setup.ts',
      use: { ...use, storageState: signedIn },
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
  webServer: [
    {
      command: 'npm run build && npm run start',
      env: {
        // A production build hides the design kit and screens; the tests need them.
        KINSCAPE_DEV_PAGES: '1',
        // The server fails at start without Supabase and database variables; the memory adapters need neither.
        KINSCAPE_MEMORY_ADAPTERS: '1',
        NEXT_PUBLIC_E2E: '1',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      url: 'http://localhost:3000',
    },
    // The same build with the design kit and screens hidden, as in production, for
    // e2e/dev-pages.spec.mts. It starts after the server above, so the build exists.
    {
      command: 'npm run start -- -p 3001',
      env: { KINSCAPE_MEMORY_ADAPTERS: '1', NEXT_PUBLIC_E2E: '1' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      url: 'http://localhost:3001/sign-in',
    },
  ],
  // The CI runner has 2 cores; elsewhere Playwright picks.
  workers: process.env.CI ? 2 : undefined,
});
