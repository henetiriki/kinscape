import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const PLAYWRIGHT = '.github/images/playwright/Dockerfile';
const POSTGRES = '.github/images/postgres/Dockerfile';
const PLAYWRIGHT_FROM =
  /^FROM mcr\.microsoft\.com\/playwright:v([^\s@-]+)-noble@sha256:[0-9a-f]{64}$/;
const POSTGRES_FROM = /^FROM postgres:17\.\d+@sha256:[0-9a-f]{64}$/;
const READ_FROM = "sed -n 's/^FROM //p'";

const fromLines = (file: string) =>
  read(file)
    .split('\n')
    .filter(line => line.startsWith('FROM '));

describe('the Playwright container image', () => {
  const playwright: string = JSON.parse(read('package.json')).devDependencies[
    '@playwright/test'
  ];

  it(`is pinned by tag and digest, alone on the one FROM line of ${PLAYWRIGHT}`, () => {
    expect(
      fromLines(PLAYWRIGHT),
      `${PLAYWRIGHT} needs one FROM mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest> line`
    ).toHaveLength(1);
    expect(fromLines(PLAYWRIGHT)[0]).toMatch(PLAYWRIGHT_FROM);
  });

  it('has the version of @playwright/test in package.json', () => {
    expect(
      fromLines(PLAYWRIGHT)[0]?.match(PLAYWRIGHT_FROM)?.[1],
      `${PLAYWRIGHT} and package.json pin @playwright/test ${playwright}: bump both together`
    ).toBe(playwright);
  });

  it('has no pin file besides the Dockerfile', () => {
    expect(existsSync(join(root, '.github/playwright-image'))).toBe(false);
  });

  it.each([
    ['.github/workflows/ci.yml', PLAYWRIGHT],
    ['.github/workflows/design-agent-shots.yml', PLAYWRIGHT],
    ['scripts/ci-postgres.sh', POSTGRES],
  ])('is read by %s from the FROM line of %s', (file, dockerfile) => {
    const text = read(file);

    expect(text).toContain(dockerfile);
    expect(text).toContain(READ_FROM);
  });
});

// NFR-09
describe('the Postgres container image', () => {
  it(`is pinned by minor tag and digest, alone on the one FROM line of ${POSTGRES}`, () => {
    expect(
      fromLines(POSTGRES),
      `${POSTGRES} needs one FROM postgres:17.<minor>@sha256:<digest> line`
    ).toHaveLength(1);
    expect(fromLines(POSTGRES)[0]).toMatch(POSTGRES_FROM);
  });
});

describe('the CI images', () => {
  it('are named in their Dockerfiles only', () => {
    const { status, stdout } = spawnSync(
      'git',
      [
        'grep',
        '-I',
        '-l',
        '-E',
        String.raw`mcr\.microsoft\.com/playwright|postgres:[0-9]`,
        '--',
        '.',
        ':(exclude)plans',
        ':(exclude).github/images',
        ':(exclude)__tests__',
        ':(exclude)*/__tests__/*',
      ],
      { cwd: root, encoding: 'utf8' }
    );

    // git grep exits 1 when nothing matches, and 128 when it fails.
    expect(status).toBeLessThan(2);
    expect(
      stdout.trim().split('\n').filter(Boolean),
      'these files name an image: read the FROM line of its Dockerfile instead'
    ).toEqual([]);
  });
});

type Dependabot = {
  'multi-ecosystem-groups': Record<string, { 'commit-message'?: unknown }>;
  updates: Entry[];
};
type Entry = {
  'commit-message'?: unknown;
  directory?: string;
  groups?: Record<string, { 'exclude-patterns'?: string[] }>;
  ignore?: { 'dependency-name': string; 'update-types'?: string[] }[];
  'multi-ecosystem-group'?: string;
  'package-ecosystem': string;
  patterns?: string[];
};

describe('the Dependabot configuration of the CI images', () => {
  const config = parse(read('.github/dependabot.yml')) as Dependabot;
  const entry = (ecosystem: string, directory: string) =>
    config.updates.find(
      update =>
        update['package-ecosystem'] === ecosystem &&
        update.directory === directory
    );

  it('updates the Playwright image and @playwright/test in one group', () => {
    expect(config['multi-ecosystem-groups']).toHaveProperty('playwright');
    expect(entry('npm', '/')).toMatchObject({
      'multi-ecosystem-group': 'playwright',
      patterns: ['@playwright/test'],
    });
    expect(entry('docker', '/.github/images/playwright')).toMatchObject({
      'multi-ecosystem-group': 'playwright',
    });
  });

  it('sets the commit message on the group, which is the only place it may be set', () => {
    expect(config['multi-ecosystem-groups'].playwright).toHaveProperty(
      'commit-message'
    );
    expect(entry('npm', '/')).not.toHaveProperty('commit-message');
  });

  it('keeps @playwright/test out of the development group', () => {
    expect(
      entry('npm', '/')?.groups?.development?.['exclude-patterns']
    ).toEqual(['@playwright/test']);
  });

  it('holds Postgres at its major version, outside the Playwright group', () => {
    const postgres = entry('docker', '/.github/images/postgres');

    expect(postgres).toBeDefined();
    expect(postgres).not.toHaveProperty('multi-ecosystem-group');
    expect(postgres?.ignore).toEqual([
      {
        'dependency-name': 'postgres',
        'update-types': ['version-update:semver-major'],
      },
    ]);
  });
});

// The Claude runs can't write main's cache, so ci-playwright-cache.yml saves the browser there.
// A run restores it only if its key and path match the seed's exactly.
describe('the Playwright browser cache', () => {
  const SEED = 'ci-playwright-cache.yml';
  const keyAndPath = (file: string) => {
    try {
      return read(file)
        .match(
          /name: Cache the Playwright browser\n[\s\S]*?key: (.+)\n\s*path: (.+)/
        )
        ?.slice(1);
    } catch {
      return undefined;
    }
  };
  const reference = keyAndPath('.github/actions/setup-workspace/action.yml');

  it('is cached by setup-workspace', () => {
    expect(reference).toBeDefined();
  });

  it(`is cached by ${SEED} under the same key and path as setup-workspace`, () => {
    expect(
      keyAndPath(`.github/workflows/${SEED}`),
      `${SEED} needs a "Cache the Playwright browser" step with the key and path of setup-workspace`
    ).toEqual(reference);
  });

  it('is cached by the ci.yml e2e job under the same key and path as setup-workspace', () => {
    expect(
      keyAndPath('.github/workflows/ci.yml'),
      'ci.yml needs a "Cache the Playwright browser" step with the key and path of setup-workspace, or e2e misses the cache that main saves'
    ).toEqual(reference);
  });
});
