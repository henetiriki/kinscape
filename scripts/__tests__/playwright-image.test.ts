import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { filesNaming, fromLines } from '@ks/scripts/__tests__/dockerfile';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const DOCKERFILE = 'docker/playwright/Dockerfile';
const FROM =
  /^FROM mcr\.microsoft\.com\/playwright:v([^\s@-]+)-noble@sha256:[0-9a-f]{64}$/;

describe('the Playwright container image', () => {
  const playwright: string = JSON.parse(read('package.json')).devDependencies[
    '@playwright/test'
  ];
  const from = fromLines(DOCKERFILE);

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
      `${DOCKERFILE} has ${from[0]} but package.json pins @playwright/test ${playwright}: bump both together`
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

  it('is named in its Dockerfile only', () => {
    expect(
      filesNaming(String.raw`mcr\.microsoft\.com/playwright`, DOCKERFILE),
      `these files name the image: read the FROM line of ${DOCKERFILE} instead`
    ).toEqual([]);
  });

  // One Dependabot PR moves the image and @playwright/test together.
  describe('in dependabot.yml', () => {
    const config = parse(read('.github/dependabot.yml')) as {
      'multi-ecosystem-groups': Record<string, unknown>;
      updates: {
        [key: string]: unknown;
        directory?: string;
        groups?: Record<string, { 'exclude-patterns'?: string[] }>;
        'package-ecosystem': string;
      }[];
    };
    const entry = (ecosystem: string, directory: string) =>
      config.updates.find(
        update =>
          update['package-ecosystem'] === ecosystem &&
          update.directory === directory
      );

    it('has the playwright group', () => {
      expect(config['multi-ecosystem-groups'].playwright).toEqual({
        'commit-message': { prefix: 'chore' },
        labels: ['dependencies'],
        schedule: { interval: 'weekly' },
      });
    });

    it('puts the image entry in the group', () => {
      expect(entry('docker', '/docker/playwright')).toEqual({
        directory: '/docker/playwright',
        'multi-ecosystem-group': 'playwright',
        'package-ecosystem': 'docker',
        patterns: ['*'],
      });
    });

    it('puts only @playwright/test of the npm entry in the group', () => {
      const npm = entry('npm', '/');

      expect(npm?.['multi-ecosystem-group']).toBe('playwright');
      expect(npm?.patterns).toEqual(['@playwright/test']);
    });

    it('keeps @playwright/test out of the development group', () => {
      expect(
        entry('npm', '/')?.groups?.development?.['exclude-patterns']
      ).toEqual(['@playwright/test']);
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
