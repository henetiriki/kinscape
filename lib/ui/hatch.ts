import type { CSSProperties } from 'react';

import rawTokens from '@ks/design/tokens.json';
import { hexChannels, resolveTokens } from '@ks/design/tokens.mts';

const { map } = resolveTokens(rawTokens);

/** The contested-claim stripe colour. It is `rgba()` because the design export's colour check reads no other syntax with opacity. */
export const HATCH_LINE = `rgba(${hexChannels(map.hatch.colour).join(', ')}, ${map.hatch.opacity})`;

/** The contested-claim hatch as two custom properties: the stripe colour and the fill between stripes. */
export const hatchStyle = {
  '--hatch-fill': map.polity['free-state'],
  '--hatch-line': HATCH_LINE,
} as CSSProperties;
