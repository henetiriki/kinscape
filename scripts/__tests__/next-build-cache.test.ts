import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

// The Claude runs only restore the Next.js build cache that ci.yml's e2e job saves on main. A run
// finds it only if its key is the e2e job's restore-keys prefix and its path is the same.
describe('the Next.js build cache', () => {
  const [path, prefix] =
    read('.github/workflows/ci.yml')
      .match(
        /name: Cache Next\.js build\n[\s\S]*?path: (.+)\n\s*restore-keys: (.+)/
      )
      ?.slice(1) ?? [];

  it('is saved by ci.yml with a restore-keys prefix', () => {
    expect(path).toBeDefined();
    expect(prefix).toBeDefined();
  });

  it.each([
    '.github/workflows/claude-run.yml',
    '.github/workflows/claude.yml',
    '.github/actions/setup-workspace/action.yml',
  ])('is restored by %s under the key prefix and path of ci.yml', file => {
    expect(
      read(file)
        .match(
          /name: Restore Next\.js build cache\n[\s\S]*?key: (.+)\n\s*path: (.+)/
        )
        ?.slice(1),
      `${file} needs a "Restore Next.js build cache" step with the key and path ci.yml's e2e job restores`
    ).toEqual([prefix, path]);
  });
});
