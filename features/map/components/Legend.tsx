import type { CSSProperties } from 'react';

import type { EventType } from '@/app/components/map/types';

import { Text } from '@/app/components/foundation/Text';
import { EventGlyph } from '@/app/components/map/EventGlyph';
import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/design/tokens.mts';

import styles from '@ks/app/components/map/Legend.module.css';

const { map } = resolveTokens(rawTokens);

/** The swatch values, as the map draws them; the Legend follows `map.*` in `tokens.json`. */
export const LEGEND_VARS = {
  '--legend-border': map.border.colour,
  '--legend-border-width': `${map.border.width}px`,
  '--legend-dash': `${map.border['dash-on']} ${map.border['dash-off']}`,
  '--legend-fill': map.polity['free-state'],
  '--legend-halo': map['pin-halo'].colour,
  '--legend-halo-opacity': map['pin-halo'].opacity,
  '--legend-hatch': map.hatch.colour,
  '--legend-hatch-opacity': map.hatch.opacity,
  '--legend-pin': map.pin.colour,
  '--legend-pin-opacity': map.pin['fuzzy-opacity'],
  '--legend-pin-stroke': map.pin.halo,
  '--legend-pin-stroke-width': map.pin['halo-width'],
} as CSSProperties;

const GLYPHS: [EventType, string][] = [
  ['birth', 'Birth'],
  ['residence', 'Residence'],
  ['marriage', 'Marriage'],
  ['death', 'Death'],
];

/** "Reading the map": how borders, contested claims, uncertain dates and Event types are drawn. The swatches are decoration. */
export const Legend = () => (
  <div className={styles.legend} style={LEGEND_VARS}>
    <Text as='h3' variant='overline'>
      Reading the map
    </Text>
    <span className={styles.row}>
      <svg aria-hidden='true' height='12' width='32'>
        <path className={styles.line} d='M1 6h30' />
      </svg>
      Border as recorded
    </span>
    <span className={styles.row}>
      <svg aria-hidden='true' height='12' width='32'>
        <path className={`${styles.line} ${styles.dashed}`} d='M1 6h30' />
      </svg>
      Approximate border
    </span>
    <span className={styles.row}>
      <span aria-hidden='true' className={styles.hatch} />
      Contested claim
    </span>
    <span className={styles.row}>
      <svg aria-hidden='true' height='24' width='32'>
        <circle className={styles.halo} cx='16' cy='12' r='11' />
        <circle className={styles.pin} cx='16' cy='12' r='5' />
      </svg>
      Uncertain date (ABT, BEF, AFT…)
    </span>
    <span className={styles.glyphs}>
      {GLYPHS.map(([event, name]) => (
        <span key={event}>
          <EventGlyph event={event} /> {name}
        </span>
      ))}
    </span>
  </div>
);
