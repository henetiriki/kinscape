'use client';

import { Checkbox } from '@ks/app/components/forms/Checkbox';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/features/map/components/LayersPanel.module.css';

type LayerProps = {
  onShowPolitiesChange: (show: boolean) => void;
  showPolities: boolean;
};

/** The Polity borders row: the panel's body on a desktop, the whole content of the Layers sheet on a phone. */
export const LayersRow = ({
  onShowPolitiesChange,
  showPolities,
}: LayerProps) => (
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
);

export const LayersPanel = (props: LayerProps) => (
  <aside aria-label='Layers' className={styles.panel}>
    <div className={styles.heading}>
      <Text as='h2' variant='overline'>
        Layers
      </Text>
    </div>
    <LayersRow {...props} />
  </aside>
);
