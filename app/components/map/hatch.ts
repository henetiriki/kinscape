import type { CSSProperties } from 'react';

import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/design/tokens.mts';

const { map } = resolveTokens(rawTokens);

/** The contested-claim hatch as two custom properties: the stripe colour and the fill between stripes. */
export const hatchStyle = {
  '--hatch-fill': map.polity['free-state'],
  '--hatch-line': `color-mix(in srgb, ${map.hatch.colour} ${map.hatch.opacity * 100}%, transparent)`,
} as CSSProperties;
