import { describe, expect, it } from 'vitest';

import { hexChannels, resolveTokens } from '@ks/design/tokens.mts';

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

  it('drops the notes group', () => {
    const tokens = { colour: { brand: '#264f29' }, notes: { colour: {} } };

    expect(resolveTokens(tokens)).toEqual({ colour: { brand: '#264f29' } });
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
