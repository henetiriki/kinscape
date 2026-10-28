import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const PIN = '.github/playwright-image';
const IMAGE =
  /^mcr\.microsoft\.com\/playwright:v([^\s@-]+)-noble@sha256:[0-9a-f]{64}$/;

describe('the Playwright container image', () => {
  const playwright: string = JSON.parse(read('package.json')).devDependencies[
    '@playwright/test'
  ];
  const image = read(PIN).trim();

  it(`is pinned by tag and digest, alone on one line of ${PIN}`, () => {
    expect(
      image,
      `${PIN} needs one mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest> line`
    ).toMatch(IMAGE);
  });

  it('has the version of @playwright/test in package.json', () => {
    expect(
      image.match(IMAGE)?.[1],
      `Playwright image is ${image} but package.json pins @playwright/test ${playwright}: bump both together`
    ).toBe(playwright);
  });

  it.each(
    readdirSync(join(root, '.github/workflows')).filter(file =>
      file.endsWith('.yml')
    )
  )('is not named in %s, which reads it from the pin', file => {
    expect(
      read(`.github/workflows/${file}`),
      `${file} must read the image from ${PIN}`
    ).not.toContain('mcr.microsoft.com/playwright');
  });
});

// The Claude runs can't write main's cache, so ci-playwright-cache.yml saves the browser there.
// A run restores it only if its key and path match the seed's exactly.
describe('the Playwright browser cache', () => {
  const SEED = 'ci-playwright-cache.yml';
  const keyAndPath = (file: string) => {
    try {
      return read(`.github/workflows/${file}`)
        .match(
          /name: Cache Playwright browser\n[\s\S]*?key: (.+)\n\s*path: (.+)/
        )
        ?.slice(1);
    } catch {
      return undefined;
    }
  };
  const reference = keyAndPath('claude-run.yml');

  it('is cached by claude-run.yml', () => {
    expect(reference).toBeDefined();
  });

  it.each(['claude.yml', SEED])(
    'is cached by %s under the same key and path as claude-run.yml',
    file => {
      expect(
        keyAndPath(file),
        `${file} needs a "Cache Playwright browser" step with the key and path of claude-run.yml`
      ).toEqual(reference);
    }
  );
});
