import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const DOCKERFILE = 'docker/playwright/Dockerfile';
const FROM =
  /^FROM mcr\.microsoft\.com\/playwright:v([^\s@-]+)-noble@sha256:[0-9a-f]{64}$/;

describe('the Playwright container image', () => {
  const playwright: string = JSON.parse(read('package.json')).devDependencies[
    '@playwright/test'
  ];
  // Dependabot reads only the first FROM line.
  const from = existsSync(join(root, DOCKERFILE))
    ? read(DOCKERFILE)
        .split('\n')
        .filter(line => line.startsWith('FROM '))
    : [];

  it(`is pinned by tag and digest, alone on the one FROM line of ${DOCKERFILE}`, () => {
    expect(
      from,
      `${DOCKERFILE} needs one FROM mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest> line`
    ).toHaveLength(1);
    expect(from[0]).toMatch(FROM);
  });

  it('has the version of @playwright/test in package.json', () => {
    expect(
      from[0]?.match(FROM)?.[1],
      `${DOCKERFILE} and package.json pin @playwright/test ${playwright}: bump both together`
    ).toBe(playwright);
  });

  it('has no pin file besides the Dockerfile', () => {
    expect(existsSync(join(root, '.github/playwright-image'))).toBe(false);
  });

  // A job's container can't read a file, so a step reads the FROM line and passes the image on.
  it.each(['ci.yml', 'design-agent-shots.yml'])(
    '%s reads the FROM line of the Dockerfile',
    file => {
      expect(read(`.github/workflows/${file}`)).toContain(
        `run: echo "image=$(sed -n 's/^FROM //p' ${DOCKERFILE})" >> "$GITHUB_OUTPUT"`
      );
    }
  );

  // Plans are history: they name the old pins.
  it('is named in its Dockerfile only', () => {
    const { status, stdout } = spawnSync(
      'git',
      [
        'grep',
        '-I',
        '-l',
        '-F',
        'mcr.microsoft.com/playwright',
        '--',
        '.',
        ':(exclude)plans',
        `:(exclude)${DOCKERFILE}`,
        ':(exclude)__tests__',
        ':(exclude)*/__tests__/*',
      ],
      { cwd: root, encoding: 'utf8' }
    );

    // git grep exits 1 when nothing matches, and 128 when it fails.
    expect(status).toBeLessThan(2);
    expect(
      stdout.trim().split('\n').filter(Boolean),
      `these files name the image: read the FROM line of ${DOCKERFILE} instead`
    ).toEqual([]);
  });

  // No multi-ecosystem group: GitHub rejected the group's PR.
  it('is updated by Dependabot on its own', () => {
    const { updates } = parse(read('.github/dependabot.yml')) as {
      updates: Record<string, unknown>[];
    };

    expect(
      updates.find(
        update =>
          update['package-ecosystem'] === 'docker' &&
          update.directory === '/docker/playwright'
      )
    ).toEqual({
      'commit-message': { prefix: 'chore' },
      directory: '/docker/playwright',
      labels: ['dependencies'],
      'package-ecosystem': 'docker',
      schedule: { interval: 'weekly' },
    });
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
