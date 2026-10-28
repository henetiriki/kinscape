import { hatchStyle } from '@/app/components/map/hatch';

import styles from '@ks/app/components/map/ContestedNote.module.css';

/** How many claims on the Map date are contested, with the hatch swatch. Nothing at zero. */
export const ContestedNote = ({ count }: { count: number }) =>
  count > 0 && (
    <span className={styles.note} style={hatchStyle}>
      <span aria-hidden='true' className={styles.swatch} />
      {count} contested {count === 1 ? 'claim' : 'claims'} on this date
    </span>
  );
