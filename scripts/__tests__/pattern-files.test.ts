import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
} from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  citedPaths,
  globsOf,
  matches,
  patternFiles,
  patternsFor,
} from '@ks/scripts/pattern-files.mts';

const FILES = {
  list: (dir: string) => readdirSync(dir),
  read: (path: string) => readFileSync(path, 'utf8'),
};
const frontmatter = (paths: string) => `---\npaths:\n${paths}\n---\n\n# x\n`;

describe('globsOf', () => {
  it('reads the paths of the frontmatter', () => {
    expect(globsOf(frontmatter("  - 'a/**'\n  - b.ts"))).toEqual([
      'a/**',
      'b.ts',
    ]);
  });

  it.each([
    ['no frontmatter', '# x\n'],
    ['an empty frontmatter', '---\n\n---\n# x\n'],
    ['a frontmatter with no paths', '---\nname: x\n---\n# x\n'],
    ['paths that are not a list', '---\npaths: a/**\n---\n# x\n'],
  ])('gives none for %s', (_name, text) => {
    expect(globsOf(text)).toEqual([]);
  });

  it('keeps only the strings of the list', () => {
    expect(globsOf(frontmatter('  - a.ts\n  - 7'))).toEqual(['a.ts']);
  });
});

describe('patternFiles', () => {
  it('lists each Markdown file of docs/patterns with its globs', () => {
    const files = {
      list: () => ['a.md', 'notes.txt', 'b.md'],
      read: (path: string) =>
        path === 'docs/patterns/a.md' ? frontmatter('  - a/**') : '# b\n',
    };

    expect(patternFiles(files)).toEqual([
      { globs: ['a/**'], path: 'docs/patterns/a.md' },
      { globs: [], path: 'docs/patterns/b.md' },
    ]);
  });

  it('lists the files of another folder when given one', () => {
    const files = {
      list: (dir: string) => (dir === 'docs/code-rules' ? ['scale.md'] : []),
      read: () => frontmatter('  - server/**'),
    };

    expect(patternFiles(files, 'docs/code-rules')).toEqual([
      { globs: ['server/**'], path: 'docs/code-rules/scale.md' },
    ]);
  });
});

describe('citedPaths', () => {
  it('takes the code spans that name a file or a folder', () => {
    const body = [
      'Edit `server/trees/repository.mts` and `Button.tsx`.',
      'Open `app/@map/`, then run `npm run lint`.',
      'Cache `plan:new`, not `Cache-Control` or `x`.',
    ].join('\n');

    expect(citedPaths(body)).toEqual([
      'server/trees/repository.mts',
      'Button.tsx',
      'app/@map/',
    ]);
  });

  it('drops a line suffix and repeats', () => {
    expect(
      citedPaths('`server/a.mts:12` `server/a.mts:30-40` `server/a.mts`')
    ).toEqual(['server/a.mts']);
  });

  it('ignores a path outside a code span', () => {
    expect(citedPaths('See server/trees/repository.mts here.')).toEqual([]);
  });
});

describe('matches', () => {
  it('matches a file against a glob', () => {
    expect(matches('server/trees/a.mts', ['server/trees/**'])).toBe(true);
    expect(
      matches('docker/playwright/Dockerfile', ['docker/*/Dockerfile'])
    ).toBe(true);
    expect(matches('proxy.ts', ['proxy.ts'])).toBe(true);
    expect(matches('server/other.mts', ['server/trees/**'])).toBe(false);
  });

  it('matches a folder that holds a glob or that a glob covers', () => {
    expect(matches('server/', ['server/trees/**'])).toBe(true);
    expect(matches('server/trees/', ['server/trees/**'])).toBe(true);
    expect(matches('server/trees/deep/', ['server/trees/**'])).toBe(true);
    expect(matches('lib/', ['server/trees/**'])).toBe(false);
  });
});

describe('patternsFor', () => {
  const files = [
    { globs: ['server/trees/**'], path: 'docs/patterns/tree-data.md' },
    { globs: ['lib/domain/**'], path: 'docs/patterns/domain.md' },
  ];

  it('lists each file that one cited path matches, once', () => {
    expect(
      patternsFor(
        'A `server/trees/a.mts` and `server/trees/b.mts`, then `README.md`.',
        files
      )
    ).toEqual(['docs/patterns/tree-data.md']);
  });

  it('lists none when the issue cites no matching path', () => {
    expect(patternsFor('Change `README.md`.', files)).toEqual([]);
    expect(patternsFor('No code span here.', files)).toEqual([]);
  });
});

const TRACKED = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(path => path !== '' && existsSync(path));
const matchesTracked = (globs: string[]) => {
  expect(globs.length).toBeGreaterThan(0);
  for (const glob of globs) {
    expect(
      TRACKED.some(path => posix.matchesGlob(path, glob)),
      glob
    ).toBe(true);
  }
};
// The index line of a file in a doc copies its globs, so a change to `paths:` must reach it.
const expectIndexed = (doc: string, link: string, globs: string[]) => {
  const index = readFileSync(doc, 'utf8')
    .split('\n')
    .find(line => line.includes(`](${link})`));

  expect(index, `no index line for ${link} in ${doc}`).toBeDefined();
  expect(
    Array.from(index?.matchAll(/`([^`]+)`/g) ?? [], ([, glob]) => glob)
  ).toEqual(globs);
};
// The sections of docs/code-rules.md that apply only to some paths: each loads as a rule through its
// symlink .claude/rules/code-rules-<name>.md (plans/chores/C1147-code-rules-scoped.md).
const CODE_RULE_FILES = patternFiles(FILES, 'docs/code-rules')
  .sort((a, b) => a.path.localeCompare(b.path))
  .map(file => ({
    ...file,
    link: `.claude/rules/code-rules-${posix.basename(file.path)}`,
  }));

describe('the code rule files of the repo', () => {
  it('are the three path-scoped sections', () => {
    expect(CODE_RULE_FILES.map(({ path }) => path)).toEqual([
      'docs/code-rules/pattern-table.md',
      'docs/code-rules/scale.md',
      'docs/code-rules/test-quality.md',
    ]);
  });

  it.each(CODE_RULE_FILES)(
    '$path has a symlink in .claude/rules/ to it',
    ({ link, path }) => {
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
      expect(readlinkSync(link)).toBe(`../../${path}`);
    }
  );

  it.each(CODE_RULE_FILES)(
    '$path has its globs in the index of docs/code-rules.md',
    ({ globs, path }) => {
      expectIndexed('docs/code-rules.md', path.replace('docs/', ''), globs);
    }
  );

  it.each(CODE_RULE_FILES)(
    '$path has globs that each match a tracked file',
    ({ globs }) => {
      matchesTracked(globs);
    }
  );
});

describe('the pattern files of the repo', () => {
  const files = patternFiles({ list: FILES.list, read: FILES.read });

  it('are the eight area files', () => {
    expect(files.map(({ path }) => posix.basename(path)).sort()).toEqual([
      'auth.md',
      'ci-images.md',
      'components.md',
      'data.md',
      'dev-screens.md',
      'domain.md',
      'map.md',
      'tree-data.md',
    ]);
  });

  it.each(files)('$path has a symlink in .claude/rules/ to it', ({ path }) => {
    const link = `.claude/rules/${posix.basename(path)}`;

    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readlinkSync(link)).toBe(`../../${path}`);
  });

  it.each(files)(
    '$path has its globs in the index of docs/architecture.md',
    ({ globs, path }) => {
      expectIndexed('docs/architecture.md', path.replace('docs/', ''), globs);
    }
  );

  it('and the code rule files have the only symlinks in .claude/rules/', () => {
    const links = [
      ...files.map(({ path }) => posix.basename(path)),
      ...CODE_RULE_FILES.map(({ link }) => posix.basename(link)),
    ];

    expect(
      readdirSync('.claude/rules').filter(name => !links.includes(name))
    ).toEqual([]);
  });

  it.each(files)(
    '$path has globs that each match a tracked file',
    ({ globs }) => {
      matchesTracked(globs);
    }
  );
});
