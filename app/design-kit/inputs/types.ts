import type { ControlState } from '@ks/app/components/foundation/types';

// A column of a state matrix: the state a control shows, or Disabled.
export type Column = 'default' | 'disabled' | ControlState;
