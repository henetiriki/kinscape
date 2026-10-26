import type { ComponentProps } from 'react';

import type { ControlState } from '@/app/components/foundation/types';
import type { EventType } from '@/app/components/map/types';

import { Icon } from '@/app/components/foundation/Icon';
import { EventGlyph } from '@/app/components/map/EventGlyph';

import styles from './Chip.module.css';

export const Chip = ({
  children,
  glyph,
  on,
  state,
  ...rest
}: {
  /** The Event type this chip filters on; its glyph leads the label. */
  glyph?: EventType;
  on: boolean;
  state?: ControlState;
} & Omit<ComponentProps<'button'>, 'aria-pressed' | 'className'>) => (
  <button
    aria-pressed={on}
    className={styles.chip}
    data-state={state}
    type='button'
    {...rest}>
    {glyph && <EventGlyph event={glyph} />}
    {children}
  </button>
);

/** A chosen value with a × that removes it. The × is 26px with a 44px hit area. */
export const RemovableChip = ({
  disabled,
  onRemove,
  state,
  value,
}: {
  disabled?: boolean;
  onRemove?: () => void;
  /** Shown on the ×, the control inside. */
  state?: ControlState;
  value: string;
}) => (
  <span className={styles.removable} data-disabled={disabled || undefined}>
    {value}
    <button
      aria-label={`Remove ${value}`}
      className={styles.remove}
      data-state={state}
      disabled={disabled}
      onClick={onRemove}
      type='button'>
      <Icon name='close' size={14} />
    </button>
  </span>
);
