import type { ControlState } from '@/app/components/foundation/controls';

import { IconButton } from '@/app/components/actions/IconButton';
import { Icon } from '@/app/components/foundation/Icon';

import styles from './ZoomControls.module.css';

/**
 * The card of Zoom in, Zoom out and Fit South Africa. At a limit a button is `aria-disabled`, stays in
 * the Tab order and skips its handler. `state` shows a look on Zoom in, for the design kit.
 */
export const ZoomControls = ({
  atMax,
  atMin,
  onFit,
  onZoomIn,
  onZoomOut,
  state,
}: {
  atMax?: boolean;
  atMin?: boolean;
  onFit?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  state?: ControlState;
}) => (
  <div className={styles.card}>
    <IconButton
      aria-disabled={atMax || undefined}
      label='Zoom in'
      onClick={atMax ? undefined : onZoomIn}
      state={state}>
      <Icon name='zoomIn' />
    </IconButton>
    <IconButton
      aria-disabled={atMin || undefined}
      label='Zoom out'
      onClick={atMin ? undefined : onZoomOut}>
      <Icon name='zoomOut' />
    </IconButton>
    <IconButton label='Fit South Africa' onClick={onFit}>
      <Icon name='fit' />
    </IconButton>
  </div>
);
