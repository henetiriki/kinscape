import { describe, expect, it } from 'vitest';

import { colour } from '@ks/lib/design/__tests__/dtcg-fixtures';
import {
  coloursIn,
  cssName,
  fontVariable,
  hexChannels,
  strayColours,
} from '@ks/lib/design/css.mts';

describe('hexChannels', () => {
  it('gives the red, green and blue of a #rrggbb colour, in either case', () => {
    expect(hexChannels('#8b4a1c')).toEqual([139, 74, 28]);
    expect(hexChannels('#8B4A1C')).toEqual([139, 74, 28]);
  });

  it.each(['#8b4', 'rgb(139 74 28)', 'brown', ''])(
    'throws on %j, which is not #rrggbb',
    value => {
      expect(() => hexChannels(value)).toThrow(
        `Not a #rrggbb colour: ${value}`
      );
    }
  );
});

describe('cssName', () => {
  it('leaves colours unprefixed and prefixes every other group', () => {
    expect(cssName(['colour', 'ink-3'])).toBe('--ink-3');
    expect(cssName(['radius', 'panel'])).toBe('--radius-panel');
    expect(cssName(['type', 'h1', 'size'])).toBe('--type-h1-size');
  });
});

describe('fontVariable', () => {
  it('names the variable after the family', () => {
    expect(fontVariable('Public Sans')).toBe('--next-font-public-sans');
  });
});

describe('coloursIn', () => {
  it('reads hex and rgb() colours without their opacity', () => {
    expect(
      coloursIn(
        'a { color: #ABC; b: #11223344; c: rgb(24 33 27 / 0.45); d: rgba(1, 2, 3, 0.5) }'
      )
    ).toEqual(['aabbcc', '112233', '18211b', '010203']);
  });

  it('ignores anchors, url() references, entities and longer words', () => {
    expect(
      coloursIn(
        '<a href="#add">x</a><use xlink:href="#bad"/><path fill="url(#grad1)"/>&#123; #abcde #fffffff'
      )
    ).toEqual([]);
  });
});

describe('strayColours', () => {
  it('lists each colour without a token once', () => {
    const tokens = {
      colour: { brand: colour('#264f29'), shade: colour('#000000', 0.1) },
    };

    expect(
      strayColours(
        'color: #264F29; a: #123456; b: #123456; c: rgba(0, 0, 0, 0.9)',
        tokens
      )
    ).toEqual(['123456']);
  });
});
