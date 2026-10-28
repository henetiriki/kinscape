import { describe, expect, it } from 'vitest';

import { resolveTokens } from '@ks/design/tokens.mts';

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
