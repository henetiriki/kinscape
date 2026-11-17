import type { PlaywrightWorkerOptions } from '@playwright/test';

import { defineConfig } from '@playwright/test';

import { authStateFor } from '@ks/lib/design/check.mts';
import { failureArtifacts } from '@ks/scripts/playwright-failures.mts';

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

// The trace and screenshot that CI keeps of a failed test. The perf project takes none: a trace
// records each test, which changes the redraw times (NFR-01).
const failures = failureArtifacts(process.env);

// Where e2e/auth.setup.ts saves the signed-in session.
const signedIn = authStateFor();

// The CI `design` job runs the design project. So the CI `e2e` job sets this to drop that project,
// and `perf` waits only for `chromium`. Every other run keeps all projects.
// The memory sign-in has no fixture Accounts, so the design project needs the memory adapters.
const memorySignIn = process.env.KINSCAPE_MEMORY_SIGN_IN === '1';
const split = process.env.E2E_SPLIT === '1';
const noDesign = split || memorySignIn;

// How both servers sign in and store data. By default the memory adapters, which need no database.
// With KINSCAPE_MEMORY_SIGN_IN=1 (the CI e2e job), the memory sign-in over the Postgres that
// KINSCAPE_DATABASE_URL names. The empty KINSCAPE_MEMORY_ADAPTERS overrides a value in the shell.
const adapters: Record<string, string> = memorySignIn
  ? { KINSCAPE_MEMORY_ADAPTERS: '', KINSCAPE_MEMORY_SIGN_IN: '1' }
  : { KINSCAPE_MEMORY_ADAPTERS: '1' };

export default defineConfig({
  // A stray `test.only` fails the run in CI instead of quietly running one test.
  forbidOnly: !!process.env.CI,
  // Run the tests inside one file side by side too, not only different files.
  fullyParallel: true,
  // A project is a named group of tests. Each picks its tests with a filter, and all
  // three use the same browser settings (`use`) above.
  projects: [
    // Signs in once through the form and saves the session; the projects below load it.
    // The tests tagged @fixture sign in as a fixture Account, which the memory sign-in lacks.
    // The sign-ins run in sequence: two at the same time exceed the canvas wait on a CI runner.
    {
      fullyParallel: false,
      grepInvert: memorySignIn ? /@fixture/ : undefined,
      name: 'setup',
      testMatch: 'auth.setup.ts',
      use: { ...use, ...failures },
    },
    // The everyday checks: every spec file except the design check and the two gallery specs.
    // Every test runs except the ones tagged @perf (those get their own project below).
    // The gallery specs have their own config, e2e/gallery.config.ts.
    {
      dependencies: ['setup'],
      grepInvert: /@perf/,
      name: 'chromium',
      testIgnore: [
        'auth.setup.ts',
        'design-check.spec.ts',
        'design-gallery.spec.ts',
        'gallery-looks.spec.ts',
        // The fixture Accounts exist only under the memory adapters.
        ...(memorySignIn ? ['fixture-accounts.spec.ts'] : []),
      ],
      use: { ...use, ...failures, storageState: signedIn },
    },
    // The design check: only design-check.spec.ts, which compares each built screen
    // with its design snapshot. It is separate so `npm run design:check` can run it
    // alone with `--project=design`.
    {
      dependencies: ['setup'],
      name: 'design',
      testMatch: 'design-check.spec.ts',
      use: { ...use, ...failures, storageState: signedIn },
    },
    // The timing tests, tagged @perf. They measure how fast the map redraws, so they
    // run alone, after the projects above finish (`dependencies`), and other
    // workers don't slow them. If a dependency fails, Playwright skips this one.
    {
      dependencies: noDesign ? ['chromium'] : ['chromium', 'design'],
      grep: /@perf/,
      name: 'perf',
      testIgnore: 'auth.setup.ts',
      use: { ...use, storageState: signedIn },
    },
  ].filter(({ name }) => !noDesign || name !== 'design'),
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
        ...adapters,
        NEXT_PUBLIC_E2E: '1',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      url: 'http://localhost:3000',
    },
    // The same build with the design kit and screens hidden, as in production, for
    // e2e/dev-pages.spec.mts. It starts after the server above, so in CI the build exists.
    // Locally, if :3000 is already running the build is skipped: run `npm run build` first.
    {
      command: 'npm run start -- -p 3001',
      env: {
        // Overrides any value exported in the shell.
        KINSCAPE_DEV_PAGES: '',
        ...adapters,
        NEXT_PUBLIC_E2E: '1',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      url: 'http://localhost:3001/sign-in',
    },
  ],
  // The CI runner has 4 cores. Software WebGL with 4 workers starves the map start and times out
  // the two own-session tests, so CI uses 2. Elsewhere Playwright picks.
  workers: process.env.CI ? 2 : undefined,
});
