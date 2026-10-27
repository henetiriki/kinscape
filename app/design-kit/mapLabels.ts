import type { Label } from '@ks/app/design-kit/types';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/lib/design/tokens.mts';

const { map } = resolveTokens(rawTokens);

// The map's label tokens have no CSS variables, so each sample reads its own.
export const labelStyle = ({ italic, key, weight }: Label) => {
  const token = map[key];
  const tracking = 'tracking' in token ? token.tracking : 0;

  return {
    color: token.colour,
    fontSize: token.size,
    fontStyle: italic ? 'italic' : 'normal',
    fontWeight: weight,
    letterSpacing: `${tracking}em`,
  } as const;
};
