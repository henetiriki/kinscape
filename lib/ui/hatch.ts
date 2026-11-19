import type { CSSProperties } from 'react';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

const { map } = resolveTokens(rawTokens);

const channels = [1, 3, 5].map(at =>
  Number.parseInt(map.hatch.colour.slice(at, at + 2), 16)
);

/** The contested-claim stripe colour. It is `rgba()` because the design export's colour check reads no other syntax with opacity. */
export const HATCH_LINE = `rgba(${channels.join(', ')}, ${map.hatch.opacity})`;

/** The contested-claim hatch as two custom properties: the stripe colour and the fill between stripes. */
export const hatchStyle = {
  '--hatch-fill': map.polity['free-state'],
  '--hatch-line': HATCH_LINE,
} as CSSProperties;
