import type { PlaywrightWorkerOptions } from '@playwright/test';

/**
 * What a Playwright project keeps of a failed test: in CI a trace and a screenshot, which the job
 * uploads (.github/workflows/ci.yml). Elsewhere nothing: the terminal shows the failure.
 */
export const failureArtifacts = (
  env: Record<string, string | undefined>
): Partial<Pick<PlaywrightWorkerOptions, 'screenshot' | 'trace'>> =>
  env.CI ? { screenshot: 'only-on-failure', trace: 'retain-on-failure' } : {};
