import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as generatedTokens from '@ks/design/tokens.generated.ts';
import { strayColours } from '@ks/lib/design/css.mts';
import {
  dtcgProblems,
  resolvedText,
  tokenLeaves,
} from '@ks/lib/design/dtcg.mts';
import { noteProblems } from '@ks/lib/design/notes.mts';
import { scaleProblems } from '@ks/lib/design/scales.mts';
import { generate, OUTPUTS } from '@ks/scripts/tokens.mts';

const root = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const source = JSON.parse(read('design/kinscape.tokens.json'));

// Fails locally and in CI's test job when an output lags design/kinscape.tokens.json.
it.each([OUTPUTS.css, OUTPUTS.ts])(
  'has %s up to date with design/kinscape.tokens.json',
  async path => {
    expect(read(path), `${path} is out of date: run \`npm run tokens\``).toBe(
      (await generate(root))[path]
    );
  }
);

describe('design/tokens.generated.ts', () => {
  // The steps of `scale` are no output (#1197 D10).
  const groups = Object.keys(source).filter(
    key => !key.startsWith('$') && key !== 'scale'
  );

  it('holds no scale', () => {
    expect('scale' in generatedTokens).toBe(false);
  });

  it.each(groups)('holds the resolved value of each %s token', group => {
    const generated: Record<string, unknown> = generatedTokens;

    for (const { $type, path } of tokenLeaves(source[group], [group])) {
      const text = resolvedText(source, path.join('.'));
      const held = path.reduce<unknown>(
        (at, key) => (at as Record<string, unknown>)[key],
        generated
      );

      // A `map` number stays a number; each other value is its CSS text.
      expect(held, path.join('.')).toBe(
        group === 'map' && $type === 'number' ? Number(text) : text
      );
    }
  });

  it('holds the hatch stripe as rgba() text of its tokens', () => {
    expect(generatedTokens.hatchLine).toBe('rgba(139, 74, 28, 0.34)');
  });

  it('holds no notes', () => {
    expect('notes' in generatedTokens).toBe(false);
  });

  it('fails the type check on a token that does not exist', () => {
    // @ts-expect-error `nope` is not a token
    expect(generatedTokens.colour.nope).toBeUndefined();
  });
});

it('has each step of design/kinscape.tokens.json as its settings give it', () => {
  expect(scaleProblems(source), 'run `npm run tokens`').toEqual([]);
});

// The CSS leaves out most map tokens, so a reference to one would name no variable.
it('defines each var() of app/tokens.css there, or as a next/font variable', () => {
  const css = read(OUTPUTS.css);
  const defined = new Set(
    [...css.matchAll(/^\s+(--[\w-]+):/gm)].map(([, name]) => name)
  );
  const used = [...css.matchAll(/var\((--[\w-]+)\)/g)].map(([, name]) => name);

  expect(used.length).toBeGreaterThan(0);
  expect(
    used.filter(name => !defined.has(name) && !name.startsWith('--next-font-'))
  ).toEqual([]);
});

it('has design/kinscape.tokens.json follow the DTCG 2025.10 rules', () => {
  expect(dtcgProblems(JSON.parse(read('design/kinscape.tokens.json')))).toEqual(
    []
  );
});

// Snapshots are written values only; each colour in them must be a token (opacity aside).
describe('the design snapshots', () => {
  const snapshots = readdirSync(join(root, 'design/source')).filter(name =>
    name.endsWith('.html')
  );

  it('are all checked', () => {
    expect(snapshots).toHaveLength(84);
  });

  it.each(snapshots)('%s uses only token colours', name => {
    expect(strayColours(read(`design/source/${name}`), source)).toEqual([]);
  });
});

const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;

describe('colour literals', () => {
  const components = globSync(
    ['app/components/*/*.tsx', 'features/*/components/*.tsx', 'lib/ui/*.tsx'],
    { cwd: root }
  ).toSorted();

  const modules = globSync(
    ['app/**/*.module.css', 'features/**/*.module.css', 'lib/ui/*.module.css'],
    {
      cwd: root,
    }
  ).toSorted();

  it('finds the components and the CSS modules', () => {
    expect(components).toHaveLength(89);
    expect(modules.length).toBeGreaterThanOrEqual(9);
  });

  it.each([
    'app/globals.css',
    'features/map/style.ts',
    ...globSync('features/map/layers/*.ts', { cwd: root }).toSorted(),
    ...components,
    ...modules,
  ])('%s has none', path => {
    expect(read(path)).not.toMatch(COLOUR_LITERAL);
  });
});

// DM.4.3: every control lives in a module, so the shared sheet is gone.
it('has no controls.css and nothing imports it', () => {
  const sources = globSync('{app,features,lib,e2e}/**/*.{ts,tsx,css}', {
    cwd: root,
  }).filter(path => !path.endsWith('design.test.ts'));

  expect(existsSync(join(root, 'app/controls.css'))).toBe(false);
  expect(sources.filter(path => read(path).includes('controls.css'))).toEqual(
    []
  );
});

// The thumb is a pseudo-element the browser won't report, so check the source.
it('colours the slider thumb with the brand token', () => {
  const thumbs = read('features/map/components/DateSlider.module.css').match(
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
    const { layout, size } = generatedTokens;

    expect(px(layout['dock-left'])).toBe(
      px(size.gutter) + px(size.panel) + px(size.gutter)
    );
  });

  it('places a popup from its gap and popup-point-y, pointer on the right edge', () => {
    const placed = read('app/components/overlays/PlacedAt.module.css');
    const popup = read('app/components/overlays/Popup.module.css');

    expect(placed).toContain('-100% - var(--gap)');
    expect(placed).toContain('var(--y) - var(--layout-popup-point-y)');
    expect(placed).toContain('var(--layout-furniture-top)');
    expect(placed).toContain('z-index: var(--z-popup)');
    expect(read('app/components/overlays/Popup.tsx')).toContain(
      "gap='popup-gap'"
    );
    expect(popup).toMatch(/\.placedPointer \{[^}]*left: 100%/);
    expect(popup).toMatch(
      /\.placedPointer \{[^}]*top: var\(--pointer-y, var\(--layout-popup-point-y\)\)/
    );
  });

  const literals: Record<string, string[]> = {
    'app/components/feedback/Callout.module.css': ['z-index: 1;'],
    'app/components/feedback/NoticeCard.module.css': ['360px', '380px'],
    'app/components/feedback/Toast.module.css': ['80px', '164px'],
    'app/components/overlays/Dialog.module.css': ['760px', '56px'],
    'app/components/overlays/Menu.module.css': ['296px', 'z-index: 10'],
    'app/components/overlays/Popup.module.css': ['304px'],
    'features/map/components/MapShell.module.css': ['z-index: 1;'],
    'features/map/components/SearchBar.module.css': ['340px'],
    'features/map/components/ZoomControls.module.css': ['z-index: 1;'],
  };

  it.each(Object.entries(literals))(
    '%s holds no layout literal',
    (name, list) => {
      const css = read(name);

      for (const literal of list) {
        expect(css).not.toContain(literal);
      }
    }
  );
});

// The only type styles under 12.5px, each with the reason it is small.
const SMALL_TYPE: Record<string, { reason: string; size: number }> = {
  credits: { reason: 'Credits line and scale bar', size: 11 },
  mono: { reason: 'Dates and coordinates in lists', size: 12 },
  overline: { reason: 'Section headings', size: 11 },
  'overline-tight': { reason: 'Layer group headings', size: 11 },
};

describe('design/kinscape.tokens.json and design/tokens.generated.ts', () => {
  it('has a note for every token that needs one, and none for any other', () => {
    expect(
      noteProblems(JSON.parse(read('design/kinscape.tokens.json')))
    ).toEqual([]);
  });

  // NFR-06
  it('sets each type style to 12.5px or more, except the styles in SMALL_TYPE', () => {
    const sizes = Object.entries<{ size: string }>(generatedTokens.type).map(
      ([name, style]) => [name, Number.parseFloat(style.size)] as const
    );
    const small = Object.fromEntries(sizes.filter(([, size]) => size < 12.5));

    for (const [name, size] of sizes) {
      expect(Number.isFinite(size), name).toBe(true);
    }
    expect(small).toEqual(
      Object.fromEntries(
        Object.entries(SMALL_TYPE).map(([name, entry]) => [name, entry.size])
      )
    );
  });

  // NFR-06
  it('sets each map label to 11px or more', () => {
    const labels = Object.entries<{ size?: number }>(
      generatedTokens.map as unknown as Record<string, { size?: number }>
    ).filter(
      ([name, value]) =>
        name.endsWith('-label') && typeof value === 'object' && 'size' in value
    );

    expect(labels.map(([name]) => name)).toEqual([
      'polity-label',
      'contested-label',
      'place-label',
      'water-label',
      'river-label',
      'context-label',
    ]);
    for (const [name, value] of labels) {
      expect(value.size, name).toBeGreaterThanOrEqual(11);
    }
  });

  it('keys the map polity tints by the ids in data/polities.json, plus default', () => {
    const ids = JSON.parse(read('data/polities.json')).names.map(
      (entry: { polity: string }) => entry.polity
    );

    expect(Object.keys(generatedTokens.map.polity).toSorted()).toEqual(
      [...new Set<string>(ids), 'default'].toSorted()
    );
  });
});
