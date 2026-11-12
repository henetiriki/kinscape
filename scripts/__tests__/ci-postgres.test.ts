import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const SCRIPT = 'scripts/ci-postgres.sh';
const WORKFLOW = '.github/workflows/ci.yml';

type Job = {
  container?: unknown;
  if?: string;
  needs?: unknown;
  steps: Step[];
};
type Step = { env?: Record<string, string>; name?: string; run?: string };

const jobs = (parse(read(WORKFLOW)) as { jobs: Record<string, Job> }).jobs;
const indexOf = (job: string, run: string) =>
  jobs[job]?.steps.findIndex(step => step.run === run) ?? -1;

// NFR-09
describe('the Postgres container of CI', () => {
  it('is pinned by tag and digest', () => {
    expect(
      read(SCRIPT),
      `${SCRIPT} needs IMAGE='postgres:17@sha256:<digest>'`
    ).toMatch(/^IMAGE='postgres:17@sha256:[0-9a-f]{64}'$/m);
  });

  it.each([
    ['test', 'npm test'],
    ['e2e', 'npm run e2e'],
  ])('starts before the %s job runs its tests', (job, tests) => {
    const start = indexOf(job, `${SCRIPT} ${job}`);

    expect(
      start,
      `the ${job} job needs a step that runs ${SCRIPT} ${job}`
    ).toBeGreaterThanOrEqual(0);
    expect(start).toBeLessThan(indexOf(job, tests));
  });

  it('migrates and seeds before e2e runs', () => {
    const start = indexOf('e2e', `${SCRIPT} e2e`);

    expect(indexOf('e2e', 'npm run db:migrate')).toBe(start + 1);
    expect(indexOf('e2e', 'node scripts/seed-ci.mts')).toBe(start + 2);
  });

  it('runs e2e with the memory sign-in over the database', () => {
    const step = jobs.e2e?.steps.find(({ run }) => run === 'npm run e2e');

    expect(step?.env?.KINSCAPE_MEMORY_SIGN_IN).toBe('1');
    expect(step?.env?.KINSCAPE_MEMORY_ADAPTERS).toBeUndefined();
  });

  it('runs e2e on the runner, which has Docker, not in the Playwright image', () => {
    expect(jobs.e2e).not.toHaveProperty('container');
    expect(jobs.e2e).not.toHaveProperty('needs');
  });

  it.each(['test', 'e2e'])('skips draft PRs in the %s job', job => {
    expect(
      jobs[job]?.if,
      `the ${job} job needs the same draft gate as the image job`
    ).toBe(jobs.image?.if);
  });

  it('masks the password before it reaches $GITHUB_ENV', () => {
    const script = read(SCRIPT);

    expect(script.indexOf('::add-mask::$password')).toBeGreaterThan(-1);
    expect(script.indexOf('::add-mask::$password')).toBeLessThan(
      script.indexOf('>>"$GITHUB_ENV"')
    );
  });

  it('leaves the design job in the Playwright image, with no database', () => {
    expect(jobs.design).toHaveProperty('container');
    expect(JSON.stringify(jobs.design)).not.toContain('ci-postgres');
  });

  it.each([WORKFLOW, SCRIPT])(
    'holds no secret and no Supabase URL or variable in %s',
    file => {
      const text = read(file);

      expect(text).not.toMatch(/secrets\./);
      expect(text).not.toMatch(/supabase\.(co|com)|KINSCAPE_SUPABASE/i);
    }
  );
});
