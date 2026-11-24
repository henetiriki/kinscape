import { describe, expect, it } from 'vitest';

import {
  cssColour,
  cssDimension,
  cssShadow,
  cssText,
  cssTracking,
  cssTransition,
  descriptions,
  dtcgProblems,
  fontStackOf,
  notesOf,
  resolvedText,
  tokenLeaves,
  tokenText,
} from '@ks/lib/design/dtcg.mts';

const px = (value: number) => ({ unit: 'px' as const, value });
const ms = (value: number) => ({ unit: 'ms' as const, value });
const ink = {
  colorSpace: 'srgb' as const,
  components: [0.0941, 0.1294, 0.1059],
  hex: '#18211b',
};

describe('cssColour', () => {
  it('writes the hex of an opaque colour', () => {
    expect(cssColour(ink)).toBe('#18211b');
    expect(cssColour({ ...ink, alpha: 1 })).toBe('#18211b');
  });

  it('writes rgb() with the alpha of a see-through colour', () => {
    expect(cssColour({ ...ink, alpha: 0.45 })).toBe('rgb(24 33 27 / 0.45)');
  });

  it('fails on a colour with no hex', () => {
    expect(() =>
      cssColour({ colorSpace: 'srgb', components: [0, 0, 0] })
    ).toThrow('A colour has no hex');
  });
});

describe('cssDimension', () => {
  it('writes the unit, and a zero as 0', () => {
    expect(cssDimension(px(12.5))).toBe('12.5px');
    expect(cssDimension({ unit: 'rem', value: 1 })).toBe('1rem');
    expect(cssDimension(px(0))).toBe('0');
  });
});

describe('cssShadow', () => {
  const layer = {
    blur: px(2),
    color: { ...ink, alpha: 0.08 },
    offsetX: px(0),
    offsetY: px(1),
    spread: px(0),
  };

  it('writes one layer and leaves out a zero spread', () => {
    expect(cssShadow(layer)).toBe('0 1px 2px rgb(24 33 27 / 0.08)');
  });

  it('writes a list of layers, a spread and an inset', () => {
    expect(
      cssShadow([
        layer,
        { ...layer, blur: px(0), color: ink, inset: true, spread: px(1) },
      ])
    ).toBe('0 1px 2px rgb(24 33 27 / 0.08), inset 0 1px 0 1px #18211b');
  });
});

describe('cssTransition', () => {
  it('writes the duration and the keyword of the easing', () => {
    expect(
      cssTransition({
        delay: ms(0),
        duration: ms(120),
        timingFunction: [0, 0, 0.58, 1],
      })
    ).toBe('120ms ease-out');
  });

  it('writes cubic-bezier() for another easing, and a delay that is not zero', () => {
    expect(
      cssTransition({
        delay: ms(40),
        duration: ms(200),
        timingFunction: [0.2, 0, 0, 1],
      })
    ).toBe('200ms cubic-bezier(0.2, 0, 0, 1) 40ms');
  });
});

describe('cssTracking', () => {
  // #1193 D6: a zero stays a bare 0.
  it('writes a zero as 0 and each other share of the font size in em', () => {
    expect(cssTracking(0)).toBe('0');
    expect(cssTracking(-0.02)).toBe('-0.02em');
  });
});

describe('fontStackOf', () => {
  it('quotes each family that is not a generic family', () => {
    expect(fontStackOf(['Public Sans', 'system-ui', 'sans-serif'])).toBe(
      "'Public Sans', system-ui, sans-serif"
    );
    expect(fontStackOf('monospace')).toBe('monospace');
  });
});

describe('cssText', () => {
  it('writes each token type', () => {
    const text = (path: string[], $type: string, $value: unknown) =>
      cssText({ $type, $value, path });

    expect(text(['colour', 'ink'], 'color', ink)).toBe('#18211b');
    expect(text(['space', '4'], 'dimension', px(4))).toBe('4px');
    expect(text(['motion', 'toast'], 'duration', ms(4000))).toBe('4000ms');
    expect(text(['font', 'mono'], 'fontFamily', ['monospace'])).toBe(
      'monospace'
    );
    expect(text(['type', 'h1', 'weight'], 'fontWeight', 500)).toBe('500');
    expect(text(['type', 'h1', 'tracking'], 'number', -0.015)).toBe('-0.015em');
    expect(text(['z', 'menu'], 'number', 10)).toBe('10');
    expect(
      text(['shadow', 'thumb'], 'shadow', {
        blur: px(0),
        color: ink,
        offsetX: px(0),
        offsetY: px(0),
        spread: px(1),
      })
    ).toBe('0 0 0 1px #18211b');
    expect(
      text(['motion', 'press'], 'transition', {
        delay: ms(0),
        duration: ms(120),
        timingFunction: [0, 0, 0.58, 1],
      })
    ).toBe('120ms ease-out');
  });

  it('fails on a type it cannot write, and names the token', () => {
    expect(() =>
      cssText({ $type: 'gradient', $value: [], path: ['map', 'sky'] })
    ).toThrow('map.sky: no CSS for $type gradient');
  });
});

describe('dtcgProblems', () => {
  it('finds nothing in a valid tree', () => {
    expect(
      dtcgProblems({
        colour: {
          brand: { $type: 'color', $value: ink },
          focus: { $type: 'color', $value: '{colour.brand}' },
        },
        type: {
          $description: 'A group note.',
          h1: { size: { $type: 'dimension', $value: px(32) } },
        },
      })
    ).toEqual([]);
  });

  it('names a token with no type, a name with a dot or a brace, and a broken reference', () => {
    expect(
      dtcgProblems({
        colour: {
          'a.b': { $type: 'color', $value: ink },
          'c{d}': { $type: 'color', $value: ink },
          ghost: { $type: 'color', $value: '{colour.gone}' },
          plain: { $value: ink },
        },
      })
    ).toEqual([
      'colour.a.b: the name has ".", "{" or "}"',
      'colour.c{d}: the name has ".", "{" or "}"',
      'colour.ghost: {colour.gone} names no token',
      'colour.plain: no $type',
    ]);
  });

  // A value in the old shape, or a null, must fail the check and not the build.
  it('names a member that is not a group or a token, and a null $value', () => {
    expect(
      dtcgProblems({
        colour: {
          brand: '#264f29',
          empty: null,
          ink: { $type: 'color', $value: null },
        },
      })
    ).toEqual([
      'colour.brand: not a group or a token',
      'colour.empty: not a group or a token',
      'colour.ink: $value is null',
    ]);
  });

  it('names a reference inside a composite value', () => {
    expect(
      dtcgProblems({
        colour: { ink: { $type: 'color', $value: ink } },
        shadow: {
          thumb: {
            $type: 'shadow',
            $value: [{ blur: px(2), color: '{colour.ink}' }],
          },
        },
      })
    ).toEqual(['shadow.thumb: {colour.ink} is inside a composite value']);
  });

  // design/tokens.json holds one note at each path.
  it('names a note at the root, and a group note over a token note', () => {
    expect(
      dtcgProblems({
        $description: 'The tokens.',
        type: {
          body: {
            $description: 'Panels and popups.',
            size: {
              $description: 'Body size.',
              $type: 'dimension',
              $value: px(15),
            },
          },
        },
      })
    ).toEqual([
      '(root): a note at the root',
      'type.body: a group note and a token note under it',
    ]);
  });
});

const sample = {
  colour: {
    brand: {
      $description: 'Primary buttons.',
      $type: 'color',
      $value: ink,
    },
    focus: { $type: 'color', $value: '{colour.brand}' },
    glass: {
      $type: 'color',
      $value: { ...ink, alpha: 0.5 },
    },
    link: { $type: 'color', $value: '{colour.focus}' },
  },
  type: {
    body: {
      $description: 'Panels.',
      size: { $type: 'dimension', $value: px(15) },
    },
  },
};

describe('tokenLeaves', () => {
  it('lists each token with its path and $type, in file order', () => {
    expect(
      tokenLeaves(sample).map(({ $type, path }) => [path.join('.'), $type])
    ).toEqual([
      ['colour.brand', 'color'],
      ['colour.focus', 'color'],
      ['colour.glass', 'color'],
      ['colour.link', 'color'],
      ['type.body.size', 'dimension'],
    ]);
  });

  it('starts at the path it is given', () => {
    expect(tokenLeaves(sample.type, ['type']).map(({ path }) => path)).toEqual([
      ['type', 'body', 'size'],
    ]);
  });
});

describe('tokenText', () => {
  it('keeps a reference as {path} and writes any other value as CSS', () => {
    const [brand, focus, glass] = tokenLeaves(sample);

    expect(tokenText(brand)).toBe('#18211b');
    expect(tokenText(focus)).toBe('{colour.brand}');
    expect(tokenText(glass)).toBe('rgb(24 33 27 / 0.5)');
  });
});

describe('resolvedText', () => {
  it('writes a value, and follows a chain of references', () => {
    expect(resolvedText(sample, 'colour.brand')).toBe('#18211b');
    expect(resolvedText(sample, 'colour.link')).toBe('#18211b');
    expect(resolvedText(sample, 'colour.glass')).toBe('rgb(24 33 27 / 0.5)');
  });

  it('names a path that holds no token', () => {
    expect(() => resolvedText(sample, 'colour.nothing')).toThrow(
      'Unknown token reference {colour.nothing}'
    );
    expect(() => resolvedText(sample, 'colour.nothing.deeper')).toThrow(
      'Unknown token reference {colour.nothing.deeper}'
    );
    expect(() => resolvedText(sample, 'colour')).toThrow(
      'Unknown token reference {colour}'
    );
  });
});

describe('descriptions', () => {
  it('lists each $description of a group or a token, with its path', () => {
    expect(descriptions(sample)).toEqual([
      [['colour', 'brand'], 'Primary buttons.'],
      [['type', 'body'], 'Panels.'],
    ]);
  });
});

describe('notesOf', () => {
  it('maps each dotted path to its $description', () => {
    expect(notesOf(sample)).toEqual(
      new Map([
        ['colour.brand', 'Primary buttons.'],
        ['type.body', 'Panels.'],
      ])
    );
  });
});
