import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { trackedFiles } from '@ks/scripts/__tests__/tracked';
import { patternFiles, patternsFor } from '@ks/scripts/pattern-files.mts';

type Source = { path: string; text: string };

const PAGE = 'design/topics/tokens.md';
const SOURCE = /\.(?:ts|tsx|mts|mjs)$/;
const TEST_FOLDER = /(?:^|\/)(?:__tests__|e2e)\//;
// A quoted string that ends in a token file: an import specifier or a path to read.
const TOKEN_FILE =
  /(['"])[^'"\n]*design\/(?:kinscape\.tokens\.json|tokens\.generated\.ts)\1/;

/** The files outside tests that import or read `design/kinscape.tokens.json` or `design/tokens.generated.ts`. */
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
          text: "import { colour } from '@ks/design/tokens.generated.ts';",
        },
        {
          path: 'a/read.mts',
          text: "readFileSync(join(root, 'design/kinscape.tokens.json'))",
        },
      ])
    ).toEqual(['a/import.ts', 'a/read.mts']);
  });

  it('skips a test, an e2e spec, a comment and a file of another kind', () => {
    const text = "import t from '@ks/design/tokens.generated.ts';";

    expect(
      readersOf([
        { path: 'a/__tests__/x.test.ts', text },
        { path: 'e2e/x.spec.ts', text },
        { path: 'a/doc.md', text },
        {
          path: 'a/comment.ts',
          text: '/** Reads `design/kinscape.tokens.json`. */',
        },
      ])
    ).toEqual([]);
  });
});

describe('unnamed', () => {
  it.each([
    "import t from '@ks/design/tokens.generated.ts';",
    "readFileSync('design/kinscape.tokens.json')",
  ])(
    'fails for a reader that the page does not name, and names it: %s',
    text => {
      const readers = readersOf([{ path: 'synthetic/reader.ts', text }]);

      expect(unnamed(readers, 'Page names `other/file.ts`.')).toEqual([
        'synthetic/reader.ts',
      ]);
      expect(unnamed(readers, 'Page names `synthetic/reader.ts`.')).toEqual([]);
    }
  );
});

describe('the token page', () => {
  const readers = readersOf(
    trackedFiles()
      .filter(path => SOURCE.test(path))
      .map(path => ({ path, text: readFileSync(path, 'utf8') }))
  );

  it('finds the readers', () => {
    expect(readers.length).toBeGreaterThan(0);
  });

  it('has the part "The size check"', () => {
    expect(readFileSync(PAGE, 'utf8')).toMatch(/^## The size check$/m);
  });

  it('has the part "Scales"', () => {
    expect(readFileSync(PAGE, 'utf8')).toMatch(/^## Scales$/m);
  });

  it('has the part "Units"', () => {
    expect(readFileSync(PAGE, 'utf8')).toMatch(/^## Units$/m);
  });

  it('names each module outside tests that reads a token file', () => {
    expect(unnamed(readers, readFileSync(PAGE, 'utf8'))).toEqual([]);
  });
});

// `npm run plan:new` lists this page for an issue that cites the DTCG token file (#1193 D3).
it('is a design file for an issue that names design/kinscape.tokens.json', () => {
  const designFiles = patternFiles(
    { list: readdirSync, read: path => readFileSync(path, 'utf8') },
    'design/topics'
  );

  expect(
    patternsFor('Edit `design/kinscape.tokens.json`.', designFiles)
  ).toContain(PAGE);
});
