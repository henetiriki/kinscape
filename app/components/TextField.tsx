import { type ComponentProps, type ReactNode, useId } from 'react';

import type { ControlState } from './controls';

import { Icon } from './Icon';
import { Text } from './Text';
import styles from './TextField.module.css';

/** A single-line field with its label and, below it, helper text or an error that replaces it. */
export const TextField = ({
  date,
  error,
  helper,
  hideLabel,
  label,
  mark,
  state,
  ...rest
}: {
  /** The map date look: 188px wide, mono, centred. */
  date?: boolean;
  /** The problem, shown under the field in place of `helper`. Marks the field as in error. */
  error?: ReactNode;
  helper?: ReactNode;
  /** Names the input without showing the label. */
  hideLabel?: boolean;
  label: string;
  /** Marks the field when its message is shown elsewhere, or as a warning. */
  mark?: 'error' | 'warning';
  state?: ControlState;
} & Omit<ComponentProps<'input'>, 'className' | 'id' | 'type'>) => {
  const id = useId();
  const messageId = `${id}-message`;
  const marked = error ? 'error' : mark;
  const message = error ?? helper;
  const describedBy = [rest['aria-describedby'], message ? messageId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      {!hideLabel && (
        <Text as='label' htmlFor={id} variant='label'>
          {label}
        </Text>
      )}
      <span
        className={date ? `${styles.box} ${styles.date}` : styles.box}
        data-mark={marked}
        data-state={state}>
        <input
          aria-label={hideLabel ? label : undefined}
          className={styles.input}
          type='text'
          {...rest}
          aria-describedby={describedBy || undefined}
          aria-invalid={marked === 'error' || undefined}
          id={id}
        />
        {marked && <Icon name={marked} />}
      </span>
      {message && (
        <Text
          id={messageId}
          role={error ? 'alert' : undefined}
          tone={error ? 'error' : undefined}
          variant='small'>
          {message}
        </Text>
      )}
    </div>
  );
};
