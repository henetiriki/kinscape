import styles from './ContestedNote.module.css';
import { hatchStyle } from './hatch';

/** How many claims on the Map date are contested, with the hatch swatch. Nothing at zero. */
export const ContestedNote = ({ count }: { count: number }) =>
  count > 0 && (
    <span className={styles.note} style={hatchStyle}>
      <span aria-hidden='true' className={styles.swatch} />
      {count} contested {count === 1 ? 'claim' : 'claims'} on this date
    </span>
  );
