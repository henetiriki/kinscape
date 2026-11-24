import type { CSSProperties } from 'react';

import type { EventType, LegendRow } from '@ks/lib/ui/types';

import { Text } from '@ks/app/components/foundation/Text';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { EventGlyph } from '@ks/lib/ui/EventGlyph';
import { HATCH_LINE } from '@ks/lib/ui/hatch';
import { LEGEND_ROWS } from '@ks/lib/ui/legend.mts';

import styles from '@ks/features/map/components/Legend.module.css';

const { map } = resolveTokens(rawTokens);

/** The swatch values, as the map draws them; the Legend follows `map.*` in `tokens.json`. */
const LEGEND_VARS = {
  '--legend-border': map.border.colour,
  '--legend-border-width': `${map.border.width}px`,
  '--legend-dash': `${map.border['dash-on']} ${map.border['dash-off']}`,
  '--legend-fill': map.polity['free-state'],
  '--legend-halo': map['pin-halo'].colour,
  '--legend-halo-opacity': map['pin-halo'].opacity,
  '--legend-hatch': HATCH_LINE,
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

/**
 * "Reading the map": how borders, contested claims, uncertain dates and Event types are drawn. The
 * swatches are decoration. `rows` lists the rows to draw, and the default is all of them. The live
 * map lists only the marks it draws.
 */
export const Legend = ({
  rows = LEGEND_ROWS,
}: {
  rows?: readonly LegendRow[];
}) => {
  const has = (row: LegendRow) => rows.includes(row);

  return (
    <div className={styles.legend} style={LEGEND_VARS}>
      <Text as='h3' variant='overline'>
        Reading the map
      </Text>
      {has('border') && (
        <span className={styles.row}>
          <svg aria-hidden='true' height='12' role='img' width='32'>
            <path className={styles.line} d='M1 6h30' />
          </svg>
          Border as recorded
        </span>
      )}
      {has('approximate') && (
        <span className={styles.row}>
          <svg aria-hidden='true' height='12' role='img' width='32'>
            <path className={`${styles.line} ${styles.dashed}`} d='M1 6h30' />
          </svg>
          Approximate border
        </span>
      )}
      {has('contested') && (
        <span className={styles.row}>
          <span aria-hidden='true' className={styles.hatch} />
          Contested claim
        </span>
      )}
      {has('uncertain') && (
        <span className={styles.row}>
          <svg aria-hidden='true' height='24' role='img' width='32'>
            <circle className={styles.halo} cx='16' cy='12' r='11' />
            <circle className={styles.pin} cx='16' cy='12' r='5' />
          </svg>
          Uncertain date (ABT, BEF, AFT…)
        </span>
      )}
      {has('events') && (
        <span className={styles.glyphs}>
          {GLYPHS.map(([event, name]) => (
            <span key={event}>
              <EventGlyph event={event} /> {name}
            </span>
          ))}
        </span>
      )}
    </div>
  );
};
