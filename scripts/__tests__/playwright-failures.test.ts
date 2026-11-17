import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

import type { Step } from '@ks/scripts/__tests__/types';

import { authStateFor } from '@ks/lib/design/check.mts';
import { failureArtifacts } from '@ks/scripts/playwright-failures.mts';

type Project = {
  fullyParallel?: boolean;
  name?: string;
  use?: Record<string, unknown>;
};

const KEPT = { screenshot: 'only-on-failure', trace: 'retain-on-failure' };

// Loads a Playwright config as a run with or without `CI` does, and returns its projects by name.
const projects = async (
  file: 'e2e/gallery.config.ts' | 'playwright.config.ts',
  ci: string
): Promise<Record<string, Project>> => {
  vi.stubEnv('CI', ci);
  // A shell value of these two drops the design project.
  vi.stubEnv('E2E_SPLIT', '');
  vi.stubEnv('KINSCAPE_MEMORY_SIGN_IN', '');
  // The gallery config prints a line in the runner; a worker has this variable and prints nothing.
  vi.stubEnv('TEST_WORKER_INDEX', '0');
  vi.resetModules();

  const config: { default: { projects?: Project[] } } =
    file === 'playwright.config.ts'
      ? await import('@ks/playwright.config.ts')
      : await import('@ks/e2e/gallery.config.ts');

  return Object.fromEntries(
    (config.default.projects ?? []).map(project => [project.name, project])
  );
};

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

describe('playwright.config.ts', () => {
  it('runs the setup sign-ins in sequence', async () => {
    const { setup } = await projects('playwright.config.ts', '');

    expect(setup.fullyParallel).toBe(false);
  });

  it.each(['setup', 'chromium', 'design'])(
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

    expect(Object.keys(all)).toEqual(['setup', 'chromium', 'design', 'perf']);
    expect(Object.values(all).map(kept)).toEqual([{}, {}, {}, {}]);
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
