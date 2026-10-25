'use client';

import { Checkbox } from './Checkbox';
import styles from './LayersPanel.module.css';
import { Text } from './Text';

export const LayersPanel = ({
  onShowPolitiesChange,
  showPolities,
}: {
  onShowPolitiesChange: (show: boolean) => void;
  showPolities: boolean;
}) => (
  <aside aria-label='Layers' className={styles.panel}>
    <div className={styles.heading}>
      <Text as='h2' variant='overline'>
        Layers
      </Text>
    </div>
    <div className={styles.row}>
      <span className={styles.checkbox}>
        <Checkbox
          aria-describedby='polity-borders-help'
          checked={showPolities}
          id='polity-borders'
          onChange={event => onShowPolitiesChange(event.target.checked)}
        />
      </span>
      <div className={styles.text}>
        <Text as='label' htmlFor='polity-borders' variant='label'>
          Polity borders
        </Text>
        <Text id='polity-borders-help' variant='small'>
          Fills, borders and names of the Polities on the Map date.
        </Text>
      </div>
    </div>
  </aside>
);
