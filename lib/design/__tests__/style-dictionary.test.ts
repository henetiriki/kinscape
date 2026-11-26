import { describe, expect, it } from 'vitest';

import { buildTokens } from '@ks/lib/design/style-dictionary.mts';

const OUT = {
  css: 'out/tokens.css',
  ts: 'out/tokens.generated.ts',
};
const px = (value: number) => ({ unit: 'px', value });
const colour = (hex: string, alpha?: number) => ({
  colorSpace: 'srgb',
  components: [0, 0, 0],
  hex,
  ...(alpha === undefined ? {} : { alpha }),
});

const tokens = {
  colour: {
    brand: {
      $description: 'Primary buttons.',
      $type: 'color',
      $value: colour('#264f29'),
    },
    focus: { $type: 'color', $value: '{colour.brand}' },
    pin: { $type: 'color', $value: colour('#9a3b12') },
    scrim: { $type: 'color', $value: colour('#18211b', 0.45) },
  },
  font: {
    body: { $type: 'fontFamily', $value: ['Public Sans', 'system-ui'] },
  },
  map: {
    land: { $type: 'color', $value: colour('#e9ebe2') },
    'pin-halo': {
      blur: { $type: 'number', $value: 0.8 },
      colour: {
        $description: 'Uncertainty halo.',
        $type: 'color',
        $value: '{colour.pin}',
      },
      opacity: { $type: 'number', $value: 0.24 },
    },
    selected: {
      halo: { opacity: { $type: 'number', $value: 0.8 } },
      width: { $type: 'number', $value: 2.5 },
    },
  },
  type: {
    body: {
      $description: 'Panels and popups.',
      font: { $type: 'fontFamily', $value: '{font.body}' },
      size: { $type: 'dimension', $value: px(15) },
      tracking: { $type: 'number', $value: 0 },
      weight: { $type: 'fontWeight', $value: 400 },
    },
  },
  z: { menu: { $type: 'number', $value: 10 } },
};

describe('buildTokens', () => {
  it('writes the CSS: one header line, references as var(), and only the shared map tokens', async () => {
    expect((await buildTokens(tokens, OUT))[OUT.css]).toBe(
      [
        '/* Generated from design/kinscape.tokens.json by `npm run tokens`. Do not edit. */',
        ':root {',
        '  --brand: #264f29;',
        '  --focus: var(--brand);',
        '  --pin: #9a3b12;',
        '  --scrim: rgb(24 33 27 / 0.45);',
        '  --font-body: var(--next-font-public-sans), system-ui;',
        // PIN-06: the count marker and the fan share the halo and the ring of the map layers.
        '  --map-pin-halo-colour: var(--pin);',
        '  --map-pin-halo-opacity: 0.24;',
        '  --map-selected-halo-opacity: 0.8;',
        '  --map-selected-width: 2.5;',
        '  --type-body-font: var(--font-body);',
        '  --type-body-size: 15px;',
        '  --type-body-tracking: 0;',
        '  --type-body-weight: 400;',
        '  --z-menu: 10;',
        '}',
        '',
      ].join('\n')
    );
  });

  describe('a scale group', () => {
    const withScale = {
      ...tokens,
      scale: {
        space: {
          $extensions: {
            kinscape: { grid: 4, mode: 'grid', steps: 1, unit: 'px' },
          },
          '100': { $type: 'dimension', $value: px(4) },
        },
      },
      space: { '4': { $type: 'dimension', $value: '{scale.space.100}' } },
    };

    it('writes no step and no var(--scale-…), and a token that refers to a step gets its value', async () => {
      const css = (await buildTokens(withScale, OUT))[OUT.css];

      expect(css).toContain('  --space-4: 4px;');
      expect(css).not.toContain('scale');
    });

    // NFR-05, NFR-06
    it('writes a rem token as rem, with no Px number, and keeps the Px number of a px token', async () => {
      const mixed = {
        size: { icon: { $type: 'dimension', $value: px(20) } },
        space: {
          '4': { $type: 'dimension', $value: { unit: 'rem', value: 0.25 } },
        },
      };
      const out = await buildTokens(mixed, OUT);

      expect(out[OUT.css]).toContain('  --space-4: 0.25rem;');
      expect(out[OUT.ts]).not.toContain('spacePx');
      expect(out[OUT.ts]).toContain(
        'export const sizePx = {\n  "icon": 20\n} as const;'
      );
    });

    it('writes no scale export, and settings make no token', async () => {
      const text = (await buildTokens(withScale, OUT))[OUT.ts];

      expect(text).not.toContain('scale');
      expect(text).not.toContain('"grid"');
      expect(text).toContain('"4": "4px"');
    });
  });

  // NFR-05
  describe('the breakpoint queries', () => {
    const withQuery = (width: number) => ({
      breakpoint: {
        $extensions: {
          kinscape: { queries: { phone: '(max-width: {breakpoint.width})' } },
        },
        width: { $type: 'dimension', $value: px(width) },
      },
    });

    it('exports the resolved query, and a changed width changes it', async () => {
      const text = async (width: number) =>
        (await buildTokens(withQuery(width), OUT))[OUT.ts];

      expect(await text(640)).toContain(
        'export const breakpointQuery = {\n  "phone": "(max-width: 640px)"\n} as const;'
      );
      expect(await text(600)).toContain('"phone": "(max-width: 600px)"');
    });

    it('exports no query when the file names none', async () => {
      expect((await buildTokens(tokens, OUT))[OUT.ts]).not.toContain(
        'breakpointQuery'
      );
    });
  });

  describe('the TypeScript module', () => {
    const build = async () => (await buildTokens(tokens, OUT))[OUT.ts];

    it('starts with one header line', async () => {
      expect((await build()).split('\n')[0]).toBe(
        '// Generated from design/kinscape.tokens.json by `npm run tokens`. Do not edit.'
      );
    });

    it('exports one `as const` object for each group, in file order, with no notes', async () => {
      const names = [...(await build()).matchAll(/^export const (\w+) = /gm)];

      expect(names.map(([, name]) => name)).toEqual([
        'colour',
        'font',
        'map',
        'type',
        'typePx',
        'z',
      ]);
      expect(await build()).not.toContain('notes');
      expect(await build()).toContain('} as const;');
    });

    it('holds resolved values in the shape of the token tree', async () => {
      const text = await build();

      expect(text).toContain('"focus": "#264f29"');
      expect(text).toContain('"colour": "#9a3b12"');
      expect(text).toContain('"font": "\'Public Sans\', system-ui"');
      expect(text).toContain('"blur": 0.8');
      expect(text).toContain('"weight": "400"');
      expect(text).toContain('"menu": "10"');
      expect(text).not.toContain('{colour');
    });

    it('resolves a reference that Style Dictionary resolves, and keeps a map number a number', async () => {
      const text = await build();

      expect(text).toContain('"font": "\'Public Sans\', system-ui"');
      expect(text).toContain('"halo": {\n      "opacity": 0.8\n    }');
      expect(text).toContain('"colour": "#9a3b12"');
    });

    it('exports the hatch stripe as rgba() text when map.hatch exists', async () => {
      const withHatch = {
        ...tokens,
        map: {
          ...tokens.map,
          hatch: {
            colour: { $type: 'color', $value: colour('#8b4a1c') },
            opacity: { $type: 'number', $value: 0.34 },
          },
        },
      };
      const text = (await buildTokens(withHatch, OUT))[OUT.ts];

      expect(
        text
          .trimEnd()
          .endsWith('export const hatchLine = "rgba(139, 74, 28, 0.34)";')
      ).toBe(true);
    });

    it('exports no hatchLine when map.hatch is missing', async () => {
      expect(await build()).not.toContain('hatchLine');
    });

    it('holds each px length as a number in a second export, and each ms duration in motionMs', async () => {
      const withMotion = {
        ...tokens,
        motion: {
          press: { $type: 'duration', $value: { unit: 'ms', value: 120 } },
        },
      };
      const text = (await buildTokens(withMotion, OUT))[OUT.ts];

      expect(text).toContain(
        'export const typePx = {\n  "body": {\n    "size": 15\n  }\n} as const;'
      );
      expect(text).toContain(
        'export const motionMs = {\n  "press": 120\n} as const;'
      );
    });
  });
});
