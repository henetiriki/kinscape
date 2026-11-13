import type { ControlState } from '@ks/app/components/foundation/types';

// A column of a state matrix: the state a control shows, or Disabled.
export type Column = 'default' | 'disabled' | ControlState;

/** A desktop shows one of two parts of the board at a time. */
export type DesktopPart = 1 | 2;

/** A phone shows one of four parts of the board at a time. */
export type PhonePart = 1 | 2 | 3 | 4;
