import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import styles from '@ks/features/map/components/CountMarker.module.css';

/**
 * One marker for a Place that shows several Pins (PIN-06). It shows the number of Pins and has the
 * name "{count} Pins". `selected` draws the ring of the open Pin. `state`
 * shows a look for the component card.
 */
export const CountMarker = ({
  count,
  selected,
  state,
  ...rest
}: {
  count: number;
  selected?: boolean;
  state?: ControlState;
} & Omit<
  ComponentProps<'button'>,
  'aria-label' | 'children' | 'className'
>) => (
  <button
    aria-label={`${count} Pins`}
    className={styles.marker}
    data-state={state}
    type='button'
    {...rest}>
    {selected && (
      <span aria-hidden='true' className={styles.ring} data-ring='' />
    )}
    <span className={styles.disc}>{count}</span>
  </button>
);
