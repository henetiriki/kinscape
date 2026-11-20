import { describe, expect, it } from 'vitest';

import { treeUrlBreaks } from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-01, NFR-03. A Tree data URL appears only in the query layer. The repo first, then fixtures.
describe('the repo', () => {
  it('names a Tree data URL only in the query layer', () => {
    const files = readSources(['app', 'features']);

    expect(Object.keys(files)).toContain('features/map/layers/polities.ts');
    expect(treeUrlBreaks(files)).toEqual([]);
  });
});

describe('treeUrlBreaks', () => {
  it('names a map source with /data/pins', () => {
    expect(
      treeUrlBreaks({
        'features/map/layers/pins.ts':
          "export const sources = { pins: { data: '/data/pins', type: 'geojson' } };",
      })
    ).toEqual([
      'features/map/layers/pins.ts: Fetch rule: only the query layer names a Tree data URL.',
    ]);
  });

  it.each(['`/data/pins?x=${id}`', '`/data/pins`'])(
    'names a template literal %s',
    literal => {
      expect(treeUrlBreaks({ 'app/a.ts': `const u = ${literal};` })).toEqual([
        'app/a.ts: Fetch rule: only the query layer names a Tree data URL.',
      ]);
    }
  );

  it('passes a map source with /data/polities', () => {
    expect(
      treeUrlBreaks({
        'features/map/layers/polities.ts':
          "export const sources = { polities: { data: '/data/polities', type: 'geojson' } };",
      })
    ).toEqual([]);
  });

  it('passes the query layer', () => {
    expect(
      treeUrlBreaks({ 'features/pins/query.ts': "fetch('/data/pins');" })
    ).toEqual([]);
  });

  it('passes a test, a comment and a string that does not start with /data/', () => {
    expect(
      treeUrlBreaks({
        'app/__tests__/a.test.ts': "const u = '/data/pins';",
        'features/map/b.ts': "// /data/pins\nconst s = '@ks/app/data/pins';",
        'lib/c.ts': "const u = '/data/pins';",
      })
    ).toEqual([]);
  });
});
