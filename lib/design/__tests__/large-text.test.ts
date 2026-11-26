import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { LargeTextEntry } from '@ks/lib/design/types.ts';

import { listProblems, SIZES, verdictFor } from '@ks/lib/design/large-text.mts';

const root = join(import.meta.dirname, '../../..');
const screens = JSON.parse(
  readFileSync(join(root, 'design/screens.json'), 'utf8')
).screens.map(({ name }: { name: string }) => name);
const list = JSON.parse(
  readFileSync(join(root, 'lib/design/large-text.json'), 'utf8')
) as LargeTextEntry[];

const WIDTHS = SIZES.map(({ width }) => width);
const entries: LargeTextEntry[] = [{ screen: 'people-list', width: 390 }];

// NFR-05, NFR-06
describe('verdictFor', () => {
  it('fails a screen with problems and no entry, and names the screen, the width and each problem', () => {
    const result = verdictFor('people-list', 1440, ['a', 'b'], entries);

    expect(result.ok).toBe(false);
    expect(result.text).toBe(
      'people-list at 1440px fails at 200% text and is not on the list: a; b'
    );
  });

  it('fails an entry with no problems, and names the entry', () => {
    const result = verdictFor('people-list', 390, [], entries);

    expect(result.ok).toBe(false);
    expect(result.text).toBe(
      'people-list at 390px passes at 200% text: remove its entry from lib/design/large-text.json'
    );
  });

  it('passes a screen with no problems and no entry', () => {
    expect(verdictFor('people-list', 1440, [], entries)).toEqual({
      ok: true,
      text: '',
    });
  });

  it('passes a listed screen that still fails', () => {
    expect(verdictFor('people-list', 390, ['a'], entries)).toEqual({
      ok: true,
      text: '',
    });
  });
});

// NFR-05, NFR-06
describe('listProblems', () => {
  it('is empty for a list of known entries', () => {
    expect(listProblems(entries, ['people-list'], WIDTHS)).toEqual([]);
  });

  it('names an entry with an unknown screen', () => {
    expect(
      listProblems([{ screen: 'nope', width: 390 }], ['people-list'], WIDTHS)
    ).toEqual(['nope at 390px: the screen is not in design/screens.json']);
  });

  it('names an entry with an unknown width', () => {
    expect(
      listProblems(
        [{ screen: 'people-list', width: 500 }],
        ['people-list'],
        WIDTHS
      )
    ).toEqual(['people-list at 500px: the width is not 1440 or 390']);
  });

  it('names a second copy of an entry', () => {
    expect(
      listProblems([...entries, ...entries], ['people-list'], WIDTHS)
    ).toEqual(['people-list at 390px: the list holds it twice']);
  });
});

// NFR-05, NFR-06
describe('the list', () => {
  it('holds only known, single entries', () => {
    expect(listProblems(list, screens, WIDTHS)).toEqual([]);
  });
});
