import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as generatedTokens from '@ks/design/tokens.generated.ts';
import { controlProblems } from '@ks/lib/design/control-sizes.mts';
import { strayColours } from '@ks/lib/design/css.mts';
import {
  dtcgProblems,
  resolvedText,
  tokenLeaves,
} from '@ks/lib/design/dtcg.mts';
import { keyOf } from '@ks/lib/design/groups.mts';
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

// NFR-05, NFR-06 (SC.13)
describe('the spacing and control sizes', () => {
  const rem = (path: string) => Number.parseFloat(resolvedText(source, path));

  it('has the hybrid space steps 100 to 900 and no step 1000', () => {
    expect(
      Object.keys(source.scale.space)
        .filter(key => !key.startsWith('$'))
        .map(key => [key, rem(`scale.space.${key}`) * 16])
    ).toEqual([
      ['100', 4],
      ['200', 8],
      ['300', 12],
      ['400', 16],
      ['500', 24],
      ['600', 32],
      ['700', 44],
      ['800', 64],
      ['900', 92],
    ]);
  });

  // The value before SC.13, in px. A tie takes the larger step.
  const BEFORE: Record<string, number> = {
    'gap.2xl': 32,
    'gap.2xs': 4,
    'gap.3xl': 40,
    'gap.l': 20,
    'gap.m': 16,
    'gap.s': 12,
    'gap.xl': 24,
    'gap.xs': 8,
    'inset.2xl': 32,
    'inset.2xs': 4,
    'inset.3xl': 40,
    'inset.4xl': 48,
    'inset.5xl': 64,
    'inset.l': 20,
    'inset.m': 16,
    'inset.s': 12,
    'inset.xl': 24,
    'inset.xs': 8,
    'stack.2xs': 4,
    'stack.xs': 8,
  };
  const STEPS = [4, 8, 12, 16, 24, 32, 44, 64, 92];

  it.each(Object.entries(BEFORE))(
    'gives space.%s the step nearest %ipx',
    (name, before) => {
      const nearest = STEPS.reduce((best, step) =>
        Math.abs(step - before) <= Math.abs(best - before) ? step : best
      );

      expect(rem(`space.${name}`) * 16).toBe(nearest);
    }
  );

  it.each([
    ['control-small', 30],
    ['control-medium', 42],
    ['control-large', 50],
  ])('gives size.%s its parts as %ipx', (name, height) => {
    const line = rem(
      `type.${name === 'control-small' ? 'control-small' : 'control'}.line`
    );
    const inset =
      { 'control-large': 's', 'control-medium': 'xs' }[name] ?? '2xs';

    expect(line * 16 + 2 * rem(`space.inset.${inset}`) * 16 + 2 * 1).toBe(
      height
    );
    expect(resolvedText(source, `size.${name}`)).toBe(`${height}px`);
    expect(controlProblems(source)).toEqual([]);
  });

  it.each([
    ['control', 'control-medium'],
    ['field', 'control-medium'],
    ['control-l', 'control-large'],
    ['field-l', 'control-large'],
    ['search', 'control-large'],
    ['control-s', 'control-small'],
    ['control-xs', 'control-small'],
    ['chip', 'control-small'],
    ['chip-s', 'control-small'],
  ])('has size.%s refer to size.%s', (name, size) => {
    expect(source.size[name].$value).toBe(`{size.${size}}`);
    expect(read(OUTPUTS.css)).toContain(`--size-${name}: var(--size-${size});`);
  });

  it('writes each control size as a calc() of var() names', () => {
    expect(read(OUTPUTS.css)).toContain(
      '--size-control-medium: calc(var(--type-control-line) + 2 * var(--space-inset-xs) + 2 * var(--border-hairline));'
    );
  });

  it('names a stale control-size $value', () => {
    const stale = structuredClone(source);

    stale.size['control-medium'].$value.value = 44;

    expect(controlProblems(stale)).toEqual([
      'size.control-medium: $value is 44px, the parts give 42px',
    ]);
  });
});

// NFR-05, NFR-06: text and spacing follow the reader's text size, so they are rem.
describe('the units of app/tokens.css', () => {
  const declared = [...read(OUTPUTS.css).matchAll(/^\s+(--[\w-]+): (.+);$/gm)];
  const valuesOf = (name: RegExp) =>
    declared
      .filter(([, key]) => name.test(key))
      .map(([, key, value]) => ({ key, value }));
  const LENGTH = /^-?\d*\.?\d+(px|rem)$/;

  it('writes each type size, line height and space token in rem', () => {
    const rows = [
      ...valuesOf(/^--type-[\w-]+-(size|line)$/),
      ...valuesOf(/^--space-/),
    ];

    expect(rows.length).toBeGreaterThan(20);
    expect(rows.filter(({ value }) => !/^\d*\.?\d+rem$/.test(value))).toEqual(
      []
    );
  });

  it('writes each size, radius and focus length in px', () => {
    const rows = valuesOf(/^--(size|radius|focus)-/).filter(({ value }) =>
      LENGTH.test(value)
    );

    expect(rows.length).toBeGreaterThan(10);
    expect(rows.filter(({ value }) => !value.endsWith('px'))).toEqual([]);
  });

  it('writes each layout token in px, or as a space token', () => {
    const rows = valuesOf(/^--layout-/);

    expect(rows.length).toBeGreaterThan(5);
    expect(
      rows.filter(
        ({ value }) =>
          !/^\d*\.?\d+px$/.test(value) && !/^var\(--space-[\w-]+\)$/.test(value)
      )
    ).toEqual([]);
  });
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
    expect(snapshots).toHaveLength(85);
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
    'app/components/overlays/Menu.module.css': ['296px', 'z-index: 30'],
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
  caption: { reason: 'Credits and footnotes', size: 10 },
  credits: { reason: 'Credits line and scale bar', size: 10 },
  'mono-caption': { reason: 'Dates and coordinates in lists', size: 10 },
  overline: { reason: 'Section headings', size: 10 },
};

describe('design/kinscape.tokens.json and design/tokens.generated.ts', () => {
  it('has a note for every token that needs one, and none for any other', () => {
    expect(
      noteProblems(JSON.parse(read('design/kinscape.tokens.json')))
    ).toEqual([]);
  });

  it('keeps the z layers in order, with the MapLibre corners (z-index 2) between furniture and the action bar', () => {
    const { z } = generatedTokens;
    const layers = [z.furniture, z['action-bar'], z.popup, z.menu, z.modal].map(
      Number
    );

    expect(layers).toEqual([1, 10, 20, 30, 40]);
    expect(layers.toSorted((a, b) => a - b)).toEqual(layers);
    expect(layers[0]).toBeLessThan(2);
    expect(layers[1]).toBeGreaterThan(2);
  });

  it('holds only the inset, gap and stack roles in space, and gives space.gap.2xl 32px (2rem)', () => {
    expect(Object.keys(source.space).toSorted()).toEqual([
      'gap',
      'inset',
      'stack',
    ]);
    expect(resolvedText(source, 'space.gap.2xl')).toBe('2rem');
  });

  // NFR-06
  it('sets each type style to 12.5px or more, except the styles in SMALL_TYPE', () => {
    const sizes = Object.entries<{ size: string }>(generatedTokens.type).map(
      ([name, style]) =>
        [
          name,
          Number.parseFloat(
            keyOf(
              String(Number.parseFloat(style.size)),
              style.size.replace(/[\d.]+/, '')
            )
          ),
        ] as const
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
  it('sets each type size to 16 × 1.25ⁿ, rounded to a pixel, from step 200 to 900', () => {
    const px = (name: string) =>
      Number.parseFloat(resolvedText(source, `scale.text.${name}`)) * 16;

    expect(
      [200, 300, 400, 500, 600, 700, 800, 900].map(step => px(String(step)))
    ).toEqual(
      [-2, -1, 0, 1, 2, 3, 4, 5].map(power => Math.round(16 * 1.25 ** power))
    );
  });

  // NFR-06
  it('sets each line height to 1.5 × its size on a body role, 1.25 × on a heading, in steps of 4px', () => {
    const px = (path: string) =>
      Number.parseFloat(resolvedText(source, path)) * 16;
    const roundTo4 = (value: number) => Math.floor(value / 4 + 0.5) * 4;

    for (const [name, role] of Object.entries<{
      font: { $value: string };
      line: { $value: string };
      size: { $value: string };
    }>(source.type)) {
      const heading = role.font.$value === '{font.display}';
      const ratio = heading ? 1.25 : 1.5;
      const text = px(`type.${name}.size`);

      expect(px(`type.${name}.line`), name).toBe(roundTo4(text * ratio));
    }
  });

  // NFR-06
  it('gives each line of a role the step of its size, in the group of its font', () => {
    for (const [name, role] of Object.entries<{
      font: { $value: string };
      line: { $value: string };
      size: { $value: string };
    }>(source.type)) {
      const step = role.size.$value.slice(0, -1).split('.').at(-1);
      const group =
        role.font.$value === '{font.display}' ? 'line-heading' : 'line';

      expect(role.line.$value, name).toBe(`{scale.${group}.${step}}`);
    }
  });

  // NFR-06
  it('sets the page title to step 800, and step 700 on a phone', () => {
    const phone = source.type.h1.$extensions.kinscape.breakpoints.phone;

    expect(source.type.h1.size.$value).toBe('{scale.text.800}');
    expect(phone).toEqual({
      line: '{scale.line-heading.700}',
      size: '{scale.text.700}',
    });
    expect(read(OUTPUTS.css)).toContain(
      '--type-h1-size: 1.9375rem;\n    --type-h1-line: 2.5rem;'
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
