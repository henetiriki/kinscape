import { describe, expect, it } from 'vitest';

import { buildTokens } from '@ks/lib/design/style-dictionary.mts';

const OUT = { css: 'out/tokens.css', json: 'out/tokens.json' };
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

  it('writes the old token tree, with each description in notes', async () => {
    expect(JSON.parse((await buildTokens(tokens, OUT))[OUT.json])).toEqual({
      colour: {
        brand: '#264f29',
        focus: '{colour.brand}',
        pin: '#9a3b12',
        scrim: 'rgb(24 33 27 / 0.45)',
      },
      font: { body: "'Public Sans', system-ui" },
      map: {
        land: '#e9ebe2',
        'pin-halo': { blur: 0.8, colour: '{colour.pin}', opacity: 0.24 },
        selected: { halo: { opacity: 0.8 }, width: 2.5 },
      },
      notes: {
        colour: { brand: 'Primary buttons.' },
        map: { 'pin-halo': { colour: 'Uncertainty halo.' } },
        type: { body: 'Panels and popups.' },
      },
      type: {
        body: {
          font: '{font.body}',
          size: '15px',
          tracking: '0',
          weight: '400',
        },
      },
      z: { menu: '10' },
    });
  });

  // The design system bundle embeds the file, so a new key order changes its bytes.
  it('writes notes in file order, a group note among the token notes', async () => {
    const { notes } = JSON.parse((await buildTokens(tokens, OUT))[OUT.json]);

    expect(Object.keys(notes)).toEqual(['colour', 'map', 'type']);
  });

  it('ends the JSON with a newline, in two-space indent', async () => {
    const json = (await buildTokens(tokens, OUT))[OUT.json];

    expect(json.startsWith('{\n  "colour": {\n')).toBe(true);
    expect(json.endsWith('}\n')).toBe(true);
  });
});
