import type { ComponentProps } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { Icon } from '@/app/components/foundation/Icon';
import styles from './LayersButton.module.css';

/** The phone's one 48px button that opens Layers and filters. */
export const LayersButton = ({
  state,
  ...rest
}: {
  state?: ControlState;
} & Omit<
  ComponentProps<'button'>,
  'aria-label' | 'children' | 'className'
>) => (
  <button
    aria-label='Layers and filters'
    className={styles.button}
    data-state={state}
    type='button'
    {...rest}>
    <Icon name='layers' size={24} />
  </button>
);
