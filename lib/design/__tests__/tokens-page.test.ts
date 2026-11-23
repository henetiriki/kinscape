import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Source = { path: string; text: string };

const PAGE = 'design/topics/tokens.md';
const SOURCE = /\.(?:ts|tsx|mts|mjs)$/;
const TEST_FOLDER = /(?:^|\/)(?:__tests__|e2e)\//;
// A quoted string that ends in the token file: an import specifier or a path to read.
const TOKEN_FILE = /(['"])[^'"\n]*design\/tokens\.json\1/;

/** The files outside tests that import or read `design/tokens.json`. */
const readersOf = (files: Source[]) =>
  files
    .filter(
      ({ path, text }) =>
        SOURCE.test(path) && !TEST_FOLDER.test(path) && TOKEN_FILE.test(text)
    )
    .map(({ path }) => path);

/** The readers that the page does not name in a code span. */
const unnamed = (readers: string[], page: string) =>
  readers.filter(reader => !page.includes(`\`${reader}\``));

describe('readersOf', () => {
  it('takes a module that imports or reads the token file', () => {
    expect(
      readersOf([
        {
          path: 'a/import.ts',
          text: "import t from '@ks/design/tokens.json';",
        },
        {
          path: 'a/read.mts',
          text: "readFileSync(join(root, 'design/tokens.json'))",
        },
      ])
    ).toEqual(['a/import.ts', 'a/read.mts']);
  });

  it('skips a test, an e2e spec, a comment and a file of another kind', () => {
    const text = "import t from '@ks/design/tokens.json';";

    expect(
      readersOf([
        { path: 'a/__tests__/x.test.ts', text },
        { path: 'e2e/x.spec.ts', text },
        { path: 'a/doc.md', text },
        { path: 'a/comment.ts', text: '/** Reads `design/tokens.json`. */' },
      ])
    ).toEqual([]);
  });
});

describe('unnamed', () => {
  it('fails for a reader that the page does not name, and names it', () => {
    const readers = readersOf([
      {
        path: 'synthetic/reader.ts',
        text: "import t from '@ks/design/tokens.json';",
      },
    ]);

    expect(unnamed(readers, 'Page names `other/file.ts`.')).toEqual([
      'synthetic/reader.ts',
    ]);
    expect(unnamed(readers, 'Page names `synthetic/reader.ts`.')).toEqual([]);
  });
});

describe('the token page', () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(path => path !== '' && existsSync(path));
  const readers = readersOf(
    tracked
      .filter(path => SOURCE.test(path))
      .map(path => ({ path, text: readFileSync(path, 'utf8') }))
  );

  it('finds the readers', () => {
    expect(readers.length).toBeGreaterThan(0);
  });

  it('names each module outside tests that reads design/tokens.json', () => {
    expect(unnamed(readers, readFileSync(PAGE, 'utf8'))).toEqual([]);
  });
});
