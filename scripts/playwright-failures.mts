import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';

/**
 * What a Playwright project keeps of a failed test: in CI a trace and a screenshot, which the job
 * uploads (.github/workflows/ci.yml). Elsewhere nothing: the terminal shows the failure.
 */
export const failureArtifacts = (
  env: Record<string, string | undefined>
): Partial<Pick<PlaywrightWorkerOptions, 'screenshot' | 'trace'>> =>
  env.CI ? { screenshot: 'only-on-failure', trace: 'retain-on-failure' } : {};

/**
 * The limits of a Playwright config in CI. The runner has 4 cores, which the workers share with the
 * app servers and Postgres: 3 workers leave a core for those. A browser that waits for a core shows
 * a result late, so an assertion gets 10 s. Elsewhere Playwright picks both.
 */
export const ciLimits = (
  env: Record<string, string | undefined>
): Pick<PlaywrightTestConfig, 'expect' | 'workers'> =>
  env.CI ? { expect: { timeout: 10_000 }, workers: 3 } : {};
