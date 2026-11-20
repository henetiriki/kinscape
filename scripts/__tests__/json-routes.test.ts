import { describe, expect, it } from 'vitest';

import { JSON_EXEMPT, jsonRouteBreaks } from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-03. A route handler sends JSON through `privateJson()`: the repo first, then fixtures.
const BREAK = 'Cache rule: a route handler sends JSON through privateJson().';

describe('the repo', () => {
  it('sends no JSON from a route handler off the list', () => {
    const files = readSources(['app']);

    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(Object.keys(JSON_EXEMPT))
    );
    expect(jsonRouteBreaks(files)).toEqual([]);
  });
});

describe('jsonRouteBreaks', () => {
  it.each([
    ['Response.json', 'export const GET = () => Response.json({});'],
    ['NextResponse.json', 'export const GET = () => NextResponse.json({});'],
  ])('names a route that calls %s', (_name, source) => {
    expect(jsonRouteBreaks({ 'app/data/pins/route.ts': source })).toEqual([
      `app/data/pins/route.ts: ${BREAK}`,
    ]);
  });

  it('passes a route on the list, a route that uses privateJson, a page and a comment', () => {
    expect(
      jsonRouteBreaks({
        'app/data/pins/route.ts':
          'export const GET = () => privateJson({});\n// Response.json({})',
        'app/data/polities/route.ts':
          'export const GET = () => Response.json({});',
        'app/page.tsx': 'const a = Response.json({});',
      })
    ).toEqual([]);
  });
});
