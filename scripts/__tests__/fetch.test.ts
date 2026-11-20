import { describe, expect, it } from 'vitest';

import { fetchBreaks } from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-01, NFR-03. The browser reads Tree data through the query layer only. The repo first, then
// fixtures.
describe('the repo', () => {
  it('calls fetch only in the query layer', () => {
    const files = readSources(['app', 'features']);

    expect(Object.keys(files)).toContain('features/pins/query.ts');
    expect(fetchBreaks(files)).toEqual([]);
  });
});

describe('fetchBreaks', () => {
  it('names a file outside the query layer that calls fetch', () => {
    expect(
      fetchBreaks({ 'features/map/a.ts': "await fetch('/data/pins');" })
    ).toEqual([
      'features/map/a.ts: Fetch rule: only the query layer reads fetch.',
    ]);
  });

  it.each([
    'window.fetch(url)',
    'globalThis.fetch(url)',
    'self.fetch(url)',
    "window['fetch'](url)",
    "globalThis['fetch']",
    'self[`fetch`](url)',
    'const get = fetch;',
    'fetch.bind(window)',
    'const fetch = 1;',
  ])('names a file with %s', code => {
    expect(fetchBreaks({ 'app/a.ts': code })).toEqual([
      'app/a.ts: Fetch rule: only the query layer reads fetch.',
    ]);
  });

  it('passes the query layer', () => {
    expect(
      fetchBreaks({ 'features/pins/query.ts': "await fetch('/data/pins');" })
    ).toEqual([]);
  });

  it('passes router.prefetch, a property named fetch on another object, a comment, a string and a test', () => {
    expect(
      fetchBreaks({
        'app/__tests__/a.test.ts': 'vi.stubGlobal(fetch);',
        'features/map/b.tsx':
          "router.prefetch('/a');\nconst x = client.fetch;\nconst y = client['fetch'];\n// fetch\nconst s = 'fetch';",
        'lib/c.ts': 'fetch(url);',
      })
    ).toEqual([]);
  });
});
