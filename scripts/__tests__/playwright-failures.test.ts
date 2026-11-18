import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

import type { Step } from '@ks/scripts/__tests__/types';

import { authStateFor } from '@ks/lib/design/check.mts';
import {
  ciLimits,
  failureArtifacts,
} from '@ks/scripts/playwright-failures.mts';

type Config = {
  expect?: { timeout?: number };
  projects?: Project[];
  workers?: number | string;
};

type ConfigFile = 'e2e/gallery.config.ts' | 'playwright.config.ts';

type Project = {
  fullyParallel?: boolean;
  name?: string;
  use?: Record<string, unknown>;
};

const KEPT = { screenshot: 'only-on-failure', trace: 'retain-on-failure' };
const LIMITS = { expect: { timeout: 10_000 }, workers: 3 };

// Loads a Playwright config as a run with or without `CI` does.
const load = async (file: ConfigFile, ci: string): Promise<Config> => {
  vi.stubEnv('CI', ci);
  // A shell value of these two drops the design project.
  vi.stubEnv('E2E_SPLIT', '');
  vi.stubEnv('KINSCAPE_MEMORY_SIGN_IN', '');
  // The gallery config prints a line in the runner; a worker has this variable and prints nothing.
  vi.stubEnv('TEST_WORKER_INDEX', '0');
  vi.resetModules();

  const config: { default: Config } =
    file === 'playwright.config.ts'
      ? await import('@ks/playwright.config.ts')
      : await import('@ks/e2e/gallery.config.ts');

  return config.default;
};

// The projects of a config, by name.
const projects = async (
  file: ConfigFile,
  ci: string
): Promise<Record<string, Project>> =>
  Object.fromEntries(
    ((await load(file, ci)).projects ?? []).map(project => [
      project.name,
      project,
    ])
  );

const limits = ({ expect: assertion, workers }: Config) => ({
  expect: assertion,
  workers,
});

const kept = ({ use }: Project) => ({
  screenshot: use?.screenshot,
  trace: use?.trace,
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('failureArtifacts', () => {
  it('keeps a trace and a screenshot of a failed test in CI', () => {
    expect(failureArtifacts({ CI: 'true' })).toEqual(KEPT);
  });

  it.each([{}, { CI: '' }])('keeps nothing for %o', env => {
    expect(failureArtifacts(env)).toEqual({});
  });
});

describe('ciLimits', () => {
  it('gives 3 workers and a 10 s assertion limit in CI', () => {
    expect(ciLimits({ CI: 'true' })).toEqual(LIMITS);
  });

  it.each([{}, { CI: '' }])('keeps the Playwright defaults for %o', env => {
    expect(ciLimits(env)).toEqual({});
  });
});

describe.each(['playwright.config.ts', 'e2e/gallery.config.ts'] as const)(
  'the limits of %s',
  file => {
    it('has 3 workers and a 10 s assertion limit in CI', async () => {
      expect(limits(await load(file, 'true'))).toEqual(LIMITS);
    });

    it('keeps the Playwright defaults without CI', async () => {
      expect(limits(await load(file, ''))).toEqual({
        expect: undefined,
        workers: undefined,
      });
    });
  }
);

describe('playwright.config.ts', () => {
  it.each(['setup', 'fixture-setup'])(
    'runs the %s sign-ins in sequence',
    async name => {
      expect(
        (await projects('playwright.config.ts', ''))[name].fullyParallel
      ).toBe(false);
    }
  );

  it.each(['setup', 'fixture-setup', 'fixture', 'chromium', 'design'])(
    'keeps a trace and a screenshot of a failed %s test in CI',
    async name => {
      expect(
        kept((await projects('playwright.config.ts', 'true'))[name])
      ).toEqual(KEPT);
    }
  );

  // NFR-01
  it('records nothing in the perf project in CI', async () => {
    const { perf } = await projects('playwright.config.ts', 'true');

    expect(perf.name).toBe('perf');
    expect(kept(perf)).toEqual({});
  });

  it('records nothing without CI', async () => {
    const all = await projects('playwright.config.ts', '');

    expect(Object.keys(all)).toEqual([
      'setup',
      'fixture-setup',
      'fixture',
      'chromium',
      'design',
      'perf',
    ]);
    expect(Object.values(all).map(kept)).toEqual([{}, {}, {}, {}, {}, {}]);
  });
});

describe('e2e/gallery.config.ts', () => {
  it('keeps a trace and a screenshot of a failed gallery test in CI', async () => {
    const { gallery } = await projects('e2e/gallery.config.ts', 'true');

    expect(kept(gallery)).toEqual(KEPT);
  });

  it('records nothing without CI', async () => {
    const { gallery } = await projects('e2e/gallery.config.ts', '');

    expect(gallery.name).toBe('gallery');
    expect(kept(gallery)).toEqual({});
  });
});

describe('the failure artifacts of ci.yml', () => {
  const { jobs }: { jobs: Record<string, { steps: Step[] }> } = parse(
    readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8')
  );
  const upload = (job: string, artifact: string) =>
    jobs[job].steps.find(step => step.with?.name === artifact);
  const paths = (step?: Step) => String(step?.with?.path).trim().split('\n');
  // The saved sessions of the setup project.
  const sessions = `!${authStateFor().replace(/[^/]+$/, '**')}`;

  it.each([
    ['e2e', 'e2e-failures', ['test-results', sessions]],
    // The design-check artifact holds test-results/design.
    [
      'design',
      'design-failures',
      ['test-results', sessions, '!test-results/design/**'],
    ],
    ['gallery', 'gallery', ['test-results', sessions]],
  ])(
    'the %s job uploads %s for 7 days when a test fails, without the saved sessions',
    (job, artifact, path) => {
      const step = upload(job, artifact);

      expect(step?.uses).toMatch(/^actions\/upload-artifact@[0-9a-f]{40}$/);
      expect(step?.if).toBe('${{ failure() }}');
      expect(step?.with?.['retention-days']).toBe(7);
      expect(paths(step)).toEqual(path);
    }
  );

  it('the failure upload runs after the tests of its job', () => {
    for (const [job, artifact, run] of [
      ['e2e', 'e2e-failures', 'npm run e2e'],
      ['design', 'design-failures', 'npm run design:check'],
      ['gallery', 'gallery', 'npm run design:gallery'],
    ]) {
      const { steps } = jobs[job];

      expect(steps.findIndex(step => step.run === run)).toBeGreaterThan(-1);
      expect(steps.indexOf(upload(job, artifact) as Step)).toBeGreaterThan(
        steps.findIndex(step => step.run === run)
      );
    }
  });

  it('the design job still uploads test-results/design as design-check', () => {
    expect(upload('design', 'design-check')).toMatchObject({
      if: '${{ !cancelled() }}',
      with: { path: 'test-results/design' },
    });
  });
});
