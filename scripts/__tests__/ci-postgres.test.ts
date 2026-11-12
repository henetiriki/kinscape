import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { filesNaming, fromLines } from '@ks/scripts/__tests__/dockerfile';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const DOCKERFILE = 'docker/postgres/Dockerfile';
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
  // Dependabot reads only the first FROM line, and moves the minor version in its own PR.
  it(`is pinned by minor tag and digest, alone on the one FROM line of ${DOCKERFILE}`, () => {
    const from = fromLines(DOCKERFILE);

    expect(
      from,
      `${DOCKERFILE} needs one FROM postgres:17.<minor>@sha256:<digest> line`
    ).toHaveLength(1);
    expect(from[0]).toMatch(/^FROM postgres:17\.\d+@sha256:[0-9a-f]{64}$/);
  });

  // The command and its file are one string: a comment that names the Dockerfile must not pass.
  it(`is read by ${SCRIPT} from the FROM line`, () => {
    expect(read(SCRIPT)).toContain(
      `sed -n 's/^FROM //p' "$(dirname "$0")/../${DOCKERFILE}"`
    );
  });

  it('is named in its Dockerfile only', () => {
    expect(
      filesNaming('postgres(:[0-9]|@sha256:)', DOCKERFILE),
      `these files name the image: read the FROM line of ${DOCKERFILE} instead`
    ).toEqual([]);
  });

  it('is updated by Dependabot within its major version', () => {
    const { updates } = parse(read('.github/dependabot.yml')) as {
      updates: Record<string, unknown>[];
    };

    expect(
      updates.find(
        update =>
          update['package-ecosystem'] === 'docker' &&
          update.directory === '/docker/postgres'
      )
    ).toEqual({
      'commit-message': { prefix: 'chore' },
      directory: '/docker/postgres',
      ignore: [
        {
          'dependency-name': 'postgres',
          'update-types': ['version-update:semver-major'],
        },
      ],
      labels: ['dependencies'],
      'package-ecosystem': 'docker',
      schedule: { interval: 'weekly' },
    });
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

  it('prints the Vitest project labels as plain text in the test job', () => {
    const step = jobs.test?.steps.find(({ run }) => run === 'npm test');

    expect(step?.env?.NO_COLOR).toBe('1');
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
