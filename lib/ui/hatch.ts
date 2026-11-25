import type { CSSProperties } from 'react';

import { hatchLine, map } from '@ks/design/tokens.generated.ts';

/** The contested-claim stripe colour. It is `rgba()` because the design export's colour check reads no other syntax with opacity. */
export const HATCH_LINE = hatchLine;

/** The contested-claim hatch as two custom properties: the stripe colour and the fill between stripes. */
export const hatchStyle = {
  '--hatch-fill': map.polity['free-state'],
  '--hatch-line': HATCH_LINE,
} as CSSProperties;
