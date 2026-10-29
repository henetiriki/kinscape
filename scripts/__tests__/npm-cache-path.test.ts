import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) =>
  readFileSync(join(root, '.github/workflows', file), 'utf8');

// setup-node caches the directory `npm config get cache` prints, and the cache version is a hash of
// that path. The Playwright container's home differs from the runner's, so by default a lockfile gets
// two ~190 MB entries. One literal path on both sides gives one.
const PATH = '/tmp/npm-cache';

describe('the npm cache path', () => {
  const files = readdirSync(join(root, '.github/workflows')).filter(
    file =>
      file.endsWith('.yml') &&
      (read(file).includes('cache: npm') ||
        read(file).includes('setup-workspace@'))
  );

  it('is set by the workflows that cache npm', () => {
    expect(files).toContain('ci.yml');
  });

  it.each(files)(
    `is ${PATH}, set once in the workflow-level env of %s`,
    file => {
      const text = read(file);

      expect(
        text
          .match(/^env:\n((?:  .*\n)+)/m)?.[1]
          .match(/^ {2}npm_config_cache: (.+)$/m)?.[1],
        `${file} needs "env:\\n  npm_config_cache: ${PATH}" at workflow level, so host and container jobs share one cache entry`
      ).toBe(PATH);
      expect(
        text.match(/npm_config_cache/g),
        `${file} sets npm_config_cache more than once`
      ).toHaveLength(1);
    }
  );
});
