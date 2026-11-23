'use client';

import { Button } from '@ks/app/components/actions/Button';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';
import { Floating } from '@ks/app/components/overlays/PinPopup';
import { PlacedAt } from '@ks/app/components/overlays/PlacedAt';

import styles from '@ks/app/components/overlays/ClickPopup.module.css';

type ClickPoint = { latitude: number; longitude: number };

/** "latitude, longitude" in decimal degrees with 6 decimals, latitude first. */
const pointText = ({ latitude, longitude }: ClickPoint) =>
  `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

/**
 * The popup of a click on empty map (PIN-01), at a map point in pixels from the corner of the
 * overlay area, with the point drawn as a dot. "Add a pin here" calls `onAdd` with the point.
 */
export const ClickPopup = ({
  onAdd,
  onClose,
  point,
  x,
  y,
}: {
  /** Called by "Add a pin here" with the point. */
  onAdd: (point: ClickPoint) => void;
  /** Called by Close and by Esc inside the popup. */
  onClose?: () => void;
  point: ClickPoint;
  x: number;
  y: number;
}) => (
  <>
    <span
      aria-hidden='true'
      className={styles.dot}
      data-testid='click-dot'
      style={{ left: x, top: y }}
    />
    <PlacedAt gap='popup-gap' x={x} y={y}>
      <Floating label='Add a pin here' onClose={onClose}>
        <div className={styles.body}>
          <div className={styles.top}>
            <div className={styles.header}>
              <Text variant='overline'>Point on the map</Text>
              <Text variant='mono'>{pointText(point)}</Text>
            </div>
            <span className={styles.close}>
              <IconButton label='Close' onClick={onClose}>
                <Icon name='close' size={20} />
              </IconButton>
            </span>
          </div>
          <Text variant='small'>
            The panel opens with this point filled in.
          </Text>
          <div className={styles.actions}>
            <Button onClick={() => onAdd(point)} variant='primary'>
              Add a pin here
            </Button>
          </div>
        </div>
      </Floating>
    </PlacedAt>
  </>
);
