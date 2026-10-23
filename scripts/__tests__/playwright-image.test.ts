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
