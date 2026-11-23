import { describe, expect, it } from 'vitest';

import {
  coloursIn,
  cssName,
  fontVariable,
  strayColours,
} from '@ks/lib/design/css.mts';

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
    const tokens = { colour: { brand: '#264f29', shade: 'rgb(0 0 0 / 0.1)' } };

    expect(
      strayColours(
        'color: #264F29; a: #123456; b: #123456; c: rgba(0, 0, 0, 0.9)',
        tokens
      )
    ).toEqual(['123456']);
  });
});
