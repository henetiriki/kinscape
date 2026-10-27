import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { strayColours } from '@ks/lib/design/tokens.mts';
import { generate } from '@ks/scripts/tokens.mts';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const tokens = JSON.parse(read('design/tokens.json'));

// The D4 check: fails locally and in CI's test job.
it('has app/tokens.css up to date with design/tokens.json', () => {
  expect(
    read('app/tokens.css'),
    'app/tokens.css is out of date: run `npm run tokens`'
  ).toBe(generate(root));
});

// Snapshots are written values only; each colour in them must be a token (opacity aside).
describe('the design snapshots', () => {
  const snapshots = readdirSync(join(root, 'design/source')).filter(name =>
    name.endsWith('.html')
  );

  it('are all checked', () => {
    expect(snapshots).toHaveLength(50);
  });

  it.each(snapshots)('%s uses only token colours', name => {
    expect(strayColours(read(`design/source/${name}`), tokens)).toEqual([]);
  });
});

const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;

describe('colour literals', () => {
  const components = globSync('app/components/*/*.tsx', {
    cwd: root,
  }).toSorted();

  const modules = globSync('app/**/*.module.css', { cwd: root }).toSorted();

  it('finds the components and the CSS modules', () => {
    expect(components).toHaveLength(55);
    expect(modules.length).toBeGreaterThanOrEqual(9);
  });

  it.each(['app/globals.css', 'lib/map/style.ts', ...components, ...modules])(
    '%s has none',
    path => {
      expect(read(path)).not.toMatch(COLOUR_LITERAL);
    }
  );
});

// DM.4.3: every control lives in a module, so the shared sheet is gone.
it('has no controls.css and nothing imports it', () => {
  const sources = globSync('{app,lib,e2e}/**/*.{ts,tsx,css}', {
    cwd: root,
  }).filter(path => !path.endsWith('design.test.ts'));

  expect(existsSync(join(root, 'app/controls.css'))).toBe(false);
  expect(sources.filter(path => read(path).includes('controls.css'))).toEqual(
    []
  );
});

// The thumb is a pseudo-element the browser won't report, so check the source.
it('colours the slider thumb with the brand token', () => {
  const thumbs = read('app/components/map/DateSlider.module.css').match(
    /::-(?:webkit|moz)-(?:slider|range)-thumb \{[^}]*\}/g
  );

  expect(thumbs).toHaveLength(2);
  expect(thumbs!.every(rule => rule.includes('background: var(--brand)'))).toBe(
    true
  );
});

// DM.13.8: layout values live in tokens.json, not in the screens that use them.
describe('layout tokens', () => {
  const px = (value: string) => Number.parseFloat(value);

  it('puts the dock left of the gutter, the panel and a gutter', () => {
    const { layout, size } = tokens;

    expect(px(layout['dock-left'])).toBe(
      px(size.gutter) + px(size.panel) + px(size.gutter)
    );
  });

  it('places the popup from popup-gap and popup-point-y, pointer on the right edge', () => {
    const css = read('app/components/overlays/Popup.module.css');

    expect(css).toContain('-100% - var(--layout-popup-gap)');
    expect(css).toContain('calc(-1 * var(--layout-popup-point-y))');
    expect(css).toMatch(/\.placedPointer \{[^}]*left: 100%/);
    expect(css).toMatch(
      /\.placedPointer \{[^}]*top: var\(--layout-popup-point-y\)/
    );
  });

  const literals: Record<string, string[]> = {
    'feedback/Callout.module.css': ['z-index: 1;'],
    'feedback/NoticeCard.module.css': ['360px', '380px'],
    'feedback/Toast.module.css': ['80px', '164px'],
    'map/LayersPanel.module.css': ['z-index: 1;'],
    'map/MapShell.module.css': ['z-index: 1;'],
    'map/SearchBar.module.css': ['340px'],
    'map/ZoomControls.module.css': ['z-index: 1;'],
    'overlays/Dialog.module.css': ['760px', '56px'],
    'overlays/Menu.module.css': ['296px', 'z-index: 10'],
    'overlays/Popup.module.css': ['304px'],
  };

  it.each(Object.entries(literals))(
    '%s holds no layout literal',
    (name, list) => {
      const css = read(`app/components/${name}`);

      for (const literal of list) {
        expect(css).not.toContain(literal);
      }
    }
  );

  // A media query can't read var(), so each one must match breakpoint (the desktop side is + 0.02px).
  it('writes every media query size from breakpoint', () => {
    const allowed = new Map([
      ['max-height', px(tokens.breakpoint['phone-height'])],
      ['max-width', px(tokens.breakpoint['phone-width'])],
      ['min-height', px(tokens.breakpoint['phone-height']) + 0.02],
      ['min-width', px(tokens.breakpoint['phone-width']) + 0.02],
    ]);
    const found: string[] = [];

    for (const path of globSync('app/**/*.css', { cwd: root })) {
      for (const [, feature, value] of read(path)
        .matchAll(/@media[^{]*/g)
        .flatMap(([query]) => [
          ...query.matchAll(/\((m(?:in|ax)-(?:width|height)):\s*([\d.]+)px\)/g),
        ])) {
        if (Math.abs(Number(value) - (allowed.get(feature) ?? NaN)) > 0.001) {
          found.push(`${path}: ${feature}: ${value}px`);
        }
      }
    }

    expect(found).toEqual([]);
  });
});

describe('tokens.json', () => {
  it('keys the map polity tints by the ids in data/polities.json, plus default', () => {
    const ids = JSON.parse(read('data/polities.json')).names.map(
      (entry: { polity: string }) => entry.polity
    );

    expect(Object.keys(tokens.map.polity).toSorted()).toEqual(
      [...new Set<string>(ids), 'default'].toSorted()
    );
  });
});
