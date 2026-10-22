import { resolveTokens } from '@/lib/design/tokens.mts';

import rawTokens from '../../design/tokens.json';

export type Label = {
  caps?: boolean;
  italic?: boolean;
  key: LabelKey;
  weight: 400 | 500 | 600;
};

export type LabelKey =
  | 'contested-label'
  | 'context-label'
  | 'place-label'
  | 'polity-label'
  | 'river-label'
  | 'water-label';

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
