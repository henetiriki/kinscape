import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const IMAGE =
  /mcr\.microsoft\.com\/playwright:v([^\s@-]+)-noble@sha256:[0-9a-f]{64}\b/g;

describe('the e2e container image', () => {
  const playwright: string = JSON.parse(read('package.json')).devDependencies[
    '@playwright/test'
  ];
  const images = [...read('.github/workflows/ci.yml').matchAll(IMAGE)];

  it('is pinned by tag and digest, once, in ci.yml', () => {
    expect(
      images,
      'ci.yml needs one mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest> image'
    ).toHaveLength(1);
  });

  it('has the version of @playwright/test in package.json', () => {
    expect(
      images[0]?.[1],
      `Playwright image is v${images[0]?.[1]} but package.json pins @playwright/test ${playwright}: bump both together`
    ).toBe(playwright);
  });
});
