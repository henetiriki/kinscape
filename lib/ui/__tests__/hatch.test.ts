import { expect, it } from 'vitest';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { hatchStyle } from '@ks/lib/ui/hatch';

const { map } = resolveTokens(rawTokens);

// BND-04
it('writes the hatch stripe as an rgba() colour built from map.hatch', () => {
  const style = hatchStyle as Record<string, string>;

  expect(map.hatch).toEqual({ colour: '#8b4a1c', opacity: 0.34 });
  expect(style['--hatch-line']).toBe('rgba(139, 74, 28, 0.34)');
  expect(style['--hatch-fill']).toBe(map.polity['free-state']);
});
