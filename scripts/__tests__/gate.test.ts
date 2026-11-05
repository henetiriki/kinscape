import { readdirSync } from 'node:fs';
import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { config } from '@ks/proxy';
import { SOURCE_EXTENSION } from '@ks/scripts/layers.mts';
import {
  appRoutes,
  gateBreaks,
  PUBLIC_PATHS,
  routeOf,
} from '@ks/scripts/safety.mts';
import { readSources } from '@ks/scripts/sources.mts';

// NFR-03, NFR-10. Every route is on the public list or behind both halves of the sign-in gate,
// and the gate never catches a static file: the repo first, then fixtures.
const MATCHER = config.matcher;
const EVERYTHING = '/(.*)';
const GATED = 'export const GET = async () => currentSession();';
const OPEN = 'export const GET = async () => Response.json({});';

/** The URLs Next serves as files: everything under public/, and the icons and manifest in app/. */
const staticPaths = (): string[] => [
  ...readdirSync('public', { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
    .map(entry =>
      `/${entry.parentPath}/${entry.name}`
        .split(sep)
        .join('/')
        .replace(/^\/public\//, '/')
    ),
  ...readdirSync('app', { withFileTypes: true })
    .filter(
      entry =>
        entry.isFile() &&
        !SOURCE_EXTENSION.test(entry.name) &&
        !entry.name.endsWith('.css')
    )
    .map(entry => `/${entry.name}`),
];

describe('the repo', () => {
  it('keeps every route public or gated, and every static file out of the gate', () => {
    const files = readSources(['app']);
    const statics = staticPaths();

    expect(appRoutes(Object.keys(files)).map(route => route.path)).toEqual(
      expect.arrayContaining(['/', '/data/polities', '/robots.txt', '/sign-in'])
    );
    expect(statics).toEqual(
      expect.arrayContaining(['/map/land.geojson', '/favicon.ico'])
    );
    expect(gateBreaks(files, MATCHER, statics)).toEqual([]);
  });

  it.each(['/people/j.smith', '/data/zz', '/data/polities', '/sign-installed'])(
    'matches %s, a dotted or data path',
    path => {
      expect(gateBreaks({}, MATCHER, [path])).toEqual([
        `${path}: Gate rule: the gate would redirect a static file.`,
      ]);
    }
  );
});

describe('routeOf', () => {
  it.each([
    ['app/page.tsx', '/'],
    ['app/sign-in/page.tsx', '/sign-in'],
    ['app/data/polities/route.ts', '/data/polities'],
    ['app/(group)/people/[id]/page.tsx', '/people/x'],
    ['app/people/[...rest]/route.ts', '/people/x'],
    ['app/robots.ts', '/robots.txt'],
    ['app/sitemap.ts', '/sitemap.xml'],
    ['app/manifest.ts', '/manifest.webmanifest'],
    ['app/data/x/route.js', '/data/x'],
    ['app/people/[id]/opengraph-image.tsx', '/people/x/opengraph-image'],
    ['app/icon.tsx', '/icon'],
  ])('serves %s at %s', (file, path) => {
    expect(routeOf(file)).toEqual({ file, path });
  });

  it.each([
    'app/layout.tsx',
    'app/sign-in/actions.ts',
    'app/__tests__/page.test.tsx',
    'app/design-kit/page.module.css',
    'lib/page.tsx',
  ])('is undefined for %s', file => {
    expect(routeOf(file)).toBeUndefined();
  });
});

describe('gateBreaks', () => {
  it('names a route that checks no session', () => {
    expect(gateBreaks({ 'app/trees/route.ts': OPEN }, EVERYTHING, [])).toEqual([
      'app/trees/route.ts: Gate rule: neither /trees nor a layout above it checks the session.',
    ]);
  });

  it('accepts a page gated by a layout above it, not beside it', () => {
    const layout = 'const L = async () => { await currentSession(); };';

    expect(
      gateBreaks(
        {
          'app/design-kit/colour/page.tsx': 'const P = () => null;',
          'app/design-kit/layout.tsx': layout,
          'app/screens/add-pin/page.tsx': 'const P = () => null;',
          'app/screens/other/layout.tsx': layout,
        },
        EVERYTHING,
        []
      )
    ).toEqual([
      'app/screens/add-pin/page.tsx: Gate rule: neither /screens/add-pin nor a layout above it checks the session.',
    ]);
  });

  it('does not count a layout for a route handler', () => {
    expect(
      gateBreaks(
        {
          'app/screens/export/route.ts': OPEN,
          'app/screens/layout.tsx': 'const L = () => currentSession();',
        },
        EVERYTHING,
        []
      )
    ).toEqual([
      'app/screens/export/route.ts: Gate rule: neither /screens/export nor a layout above it checks the session.',
    ]);
  });

  it('does not count treeAction, which only returns a wrapper', () => {
    expect(
      gateBreaks(
        { 'app/a/route.ts': 'const save = treeAction(schema, body);' },
        EVERYTHING,
        []
      )
    ).toHaveLength(1);
  });

  it.each([
    ['openTree', 'const r = await openTree(deps, token);'],
    ['a chained call', 'const s = await auth.currentSession();'],
  ])('accepts %s as the check', (_name, source) => {
    expect(gateBreaks({ 'app/a/page.tsx': source }, EVERYTHING, [])).toEqual(
      []
    );
  });

  it('reads the call from the syntax, not a comment or a string', () => {
    expect(
      gateBreaks(
        {
          'app/a/page.tsx':
            "// currentSession()\nconst s = 'currentSession()';\nconst t = currentSession;",
        },
        EVERYTHING,
        []
      )
    ).toHaveLength(1);
  });

  it('names a route the matcher skips', () => {
    expect(
      gateBreaks({ 'app/data/polities/route.ts': GATED }, '/((?!data/).*)', [])
    ).toEqual([
      'app/data/polities/route.ts: Gate rule: the matcher skips /data/polities.',
    ]);
  });

  it('names a public route the matcher covers', () => {
    expect(
      gateBreaks({ 'app/sign-in/page.tsx': OPEN }, EVERYTHING, [])
    ).toEqual([
      'app/sign-in/page.tsx: Gate rule: the public route /sign-in is behind the gate.',
    ]);
    expect(PUBLIC_PATHS).toContain('/robots.txt');
  });

  it('names a static file the matcher covers', () => {
    expect(gateBreaks({}, MATCHER, ['/map/land.geojson', '/a.tar'])).toEqual([
      '/a.tar: Gate rule: the gate would redirect a static file.',
    ]);
  });
});
