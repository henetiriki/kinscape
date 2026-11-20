import { describe, expect, it } from 'vitest';

import {
  ADDRESS_FOLDERS,
  addressBreaks,
  SEARCH_PARAMS,
} from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-03. An address holds an id and the parameters on the list: the repo first, then fixtures.
const PARAM = (name: string): string =>
  `app/a/page.tsx: Address rule: the search parameter ${name} is not one of edit, returnTo.`;
const BY_NAME = (file: string): string =>
  `${file}: Address rule: read a search parameter by name, from searchParams or useSearchParams().`;

describe('the repo', () => {
  it('holds only the dynamic folders and search parameters on the lists', () => {
    const files = readSources(['app']);

    expect(Object.keys(files)).toContain('app/people/[id]/page.tsx');
    expect(ADDRESS_FOLDERS).toEqual(['[id]']);
    expect(SEARCH_PARAMS).toEqual(['edit', 'returnTo']);
    expect(addressBreaks(files)).toEqual([]);
  });
});

describe('addressBreaks: folders', () => {
  it.each(['[name]', '[slug]', '[...path]'])('names a folder %s', folder => {
    expect(
      addressBreaks({
        [`app/people/${folder}/edit/page.tsx`]: 'export default () => null;',
        [`app/people/${folder}/page.tsx`]: 'export default () => null;',
      })
    ).toEqual([
      `app/people/${folder}: Address rule: a dynamic folder under app/ is one of [id].`,
    ]);
  });

  it('passes [id], a group, a slot and a test folder', () => {
    expect(
      addressBreaks({
        'app/(list)/page.tsx': '',
        'app/@map/page.tsx': '',
        'app/people/[id]/page.tsx': '',
        'app/people/[name]/__tests__/a.test.tsx': '',
      })
    ).toEqual([]);
  });
});

describe('addressBreaks: search parameters', () => {
  it('passes a destructure of the listed names, with an await and a rename', () => {
    expect(
      addressBreaks({
        'app/a/page.tsx': `
          const P = async ({ searchParams }: { searchParams: Promise<{ edit?: string }> }) => {
            const { edit, 'returnTo': r } = await searchParams;
          };`,
        'app/b/page.tsx': 'const { edit: e } = searchParams;',
      })
    ).toEqual([]);
  });

  it('names a destructured parameter off the list', () => {
    expect(
      addressBreaks({
        'app/a/page.tsx': 'const { edit, sort } = await searchParams;',
      })
    ).toEqual([PARAM('sort')]);
  });

  it.each([
    ['get', "const a = searchParams.get('sort');"],
    ['getAll', "const a = searchParams.getAll('sort');"],
    ['has', "const a = searchParams.has('sort');"],
    [
      'a useSearchParams result',
      "const q = useSearchParams();\nconst a = q.get('sort');",
    ],
    [
      'a direct useSearchParams call',
      "const a = useSearchParams().get('sort');",
    ],
  ])('names a parameter off the list read with %s', (_name, source) => {
    expect(addressBreaks({ 'app/a/page.tsx': source })).toEqual([
      PARAM('sort'),
    ]);
  });

  it('passes a listed name read with a method', () => {
    expect(
      addressBreaks({
        'app/a/page.tsx':
          "const q = useSearchParams();\nconst a = q.get('edit') ?? searchParams.has('returnTo');",
      })
    ).toEqual([]);
  });

  it.each([
    ['a spread', 'const { edit, ...rest } = await searchParams;'],
    ['a computed key', 'const { [key]: v } = await searchParams;'],
    ['a read by property', 'const a = (await searchParams).sort;'],
    ['a pass to a function', 'read(searchParams);'],
    ['a shorthand property', 'const a = { searchParams };'],
    ['a name that is not a literal', 'const a = searchParams.get(key);'],
    ['a method off the list', "const a = searchParams.entries('a');"],
    ['a call that is not a method call', 'const a = searchParams.get;'],
    [
      'a method read that is not called',
      "const a = [searchParams.get('edit')].map(searchParams.get);",
    ],
    ['an unbound useSearchParams call', 'read(useSearchParams());'],
    ['a bound result that is passed', 'const q = useSearchParams();\nread(q);'],
  ])('names a file with %s', (_name, source) => {
    expect(addressBreaks({ 'app/a/page.tsx': source })).toEqual([
      BY_NAME('app/a/page.tsx'),
    ]);
  });

  it('skips a test, a file outside app/ and a key named searchParams', () => {
    expect(
      addressBreaks({
        'app/__tests__/a.test.tsx': 'read(searchParams);',
        'app/a/page.tsx': 'const o = { searchParams: 1 };',
        'features/a.ts': 'read(searchParams);',
      })
    ).toEqual([]);
  });

  it.each([
    [
      'a props read',
      'const { sort } = await props.searchParams;',
      [PARAM('sort')],
    ],
    [
      'a request URL read',
      "const a = new URL(request.url).searchParams.get('bbox');",
      [PARAM('bbox')],
    ],
    [
      'a renamed prop',
      'const P = async ({ searchParams: q }) => { const { sort } = await q; };',
      [PARAM('sort')],
    ],
    [
      'a property that is not read by name',
      'const a = u.searchParams;',
      [BY_NAME('app/a/page.tsx')],
    ],
  ])('names a break for %s', (_name, source, breaks) => {
    expect(addressBreaks({ 'app/a/page.tsx': source })).toEqual(breaks);
  });
});
