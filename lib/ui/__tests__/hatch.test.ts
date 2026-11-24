import { expect, it } from 'vitest';

import { map } from '@ks/design/tokens.generated.ts';
import { hatchStyle } from '@ks/lib/ui/hatch';

// BND-04
it('writes the hatch stripe as an rgba() colour built from map.hatch', () => {
  const style = hatchStyle as Record<string, string>;

  expect(map.hatch).toEqual({ colour: '#8b4a1c', opacity: 0.34 });
  expect(style['--hatch-line']).toBe('rgba(139, 74, 28, 0.34)');
  expect(style['--hatch-fill']).toBe(map.polity['free-state']);
});
