import { describe, expect, it } from 'vitest';

import {
  coloursIn,
  cssName,
  cssVariables,
  fontVariable,
  renderCss,
  resolveTokens,
  strayColours,
} from '../tokens.mts';

describe('resolveTokens', () => {
  it('replaces references, including a chain of them, with the value', () => {
    const tokens = {
      colour: { brand: '#264f29', focus: '{colour.brand}' },
      map: { selected: { colour: '{colour.focus}', width: 2.5 } },
    };

    expect(resolveTokens(tokens).map).toEqual({
      selected: { colour: '#264f29', width: 2.5 },
    });
  });

  it('rejects a reference to nothing', () => {
    expect(() => resolveTokens({ a: '{b.c}' })).toThrow(
      'Unknown token reference {b.c}'
    );
    expect(() => resolveTokens({ a: '{a.b}' })).toThrow('{a.b}');
  });

  it('rejects a cycle', () => {
    expect(() => resolveTokens({ a: '{b}', b: '{a}' })).toThrow(
      'Token reference cycle'
    );
  });
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

describe('cssVariables', () => {
  const tokens = {
    colour: { brand: '#264f29', focus: '{colour.brand}' },
    font: { body: "'Public Sans', system-ui, sans-serif" },
    map: { land: '#e9ebe2' },
    scalar: 'ignored',
    type: { body: { font: '{font.body}', size: '15px' } },
  };

  it('writes references as var() and starts a font stack with the next/font variable', () => {
    expect(cssVariables(tokens)).toEqual([
      ['--brand', '#264f29'],
      ['--focus', 'var(--brand)'],
      ['--font-body', 'var(--next-font-public-sans), system-ui, sans-serif'],
      ['--type-body-font', 'var(--font-body)'],
      ['--type-body-size', '15px'],
    ]);
  });

  it('renders a header and one declaration per token', () => {
    expect(renderCss({ colour: { brand: '#264f29' } })).toBe(
      [
        '/* Generated from design/tokens.json by `npm run tokens`. Do not edit. */',
        ':root {',
        '  --brand: #264f29;',
        '}',
        '',
      ].join('\n')
    );
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
