'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useEffect, useId, useRef, useState } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { KeyHint } from '@ks/app/components/actions/KeyHint';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from './TextField.module.css';

// A key typed in these is text, not a shortcut.
const TYPES_TEXT = 'input, select, textarea, [contenteditable]';

/** A single-line field with its label and, below it, helper text or an error that replaces it. */
export const TextField = ({
  date,
  defaultShown = false,
  error,
  helper,
  hideLabel,
  label,
  mark,
  shortcut,
  size,
  state,
  type = 'text',
  ...rest
}: {
  /** The map date look: 188px wide, mono, centred. `fill` takes the width of its container instead. */
  date?: 'fill' | boolean;
  /** A password starts shown, as text. */
  defaultShown?: boolean;
  /** The problem, shown under the field in place of `helper`. Marks the field as in error. */
  error?: ReactNode;
  helper?: ReactNode;
  /** Names the input without showing the label. */
  hideLabel?: boolean;
  label: string;
  /** Marks the field when its message is shown elsewhere, or as a warning. */
  mark?: 'error' | 'warning';
  /** A key that focuses the field when no text input has focus. A search field shows it as a hint. */
  shortcut?: string;
  /** `l` is the 48px sign-in field. */
  size?: 'l';
  state?: ControlState;
  type?: 'email' | 'password' | 'search' | 'text';
} & Omit<ComponentProps<'input'>, 'className' | 'id' | 'size' | 'type'>) => {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(defaultShown);
  const messageId = `${id}-message`;
  const marked = error ? 'error' : mark;
  const message = error ?? helper;
  const describedBy = [rest['aria-describedby'], message ? messageId : null]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!shortcut) return;

    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== shortcut ||
        // Another field already took the key.
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof Element && event.target.closest(TYPES_TEXT))
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  return (
    <div className={styles.field}>
      {!hideLabel && (
        <Text as='label' htmlFor={id} variant='label'>
          {label}
        </Text>
      )}
      <span
        className={date ? `${styles.box} ${styles.date}` : styles.box}
        data-fill={date === 'fill' || undefined}
        data-mark={marked}
        data-size={size}
        data-state={state}
        data-type={type === 'search' ? 'search' : undefined}>
        {type === 'search' && <Icon name='search' />}
        <input
          aria-keyshortcuts={shortcut}
          aria-label={hideLabel ? label : undefined}
          className={styles.input}
          {...rest}
          aria-describedby={describedBy || undefined}
          aria-invalid={marked === 'error' || undefined}
          id={id}
          ref={input}
          type={type === 'password' && shown ? 'text' : type}
        />
        {marked && <Icon name={marked} />}
        {type === 'search' && shortcut && (
          <KeyHint decorative>{shortcut}</KeyHint>
        )}
        {type === 'password' && (
          <button
            aria-label={shown ? 'Hide password' : 'Show password'}
            className={styles.eye}
            disabled={rest.disabled}
            onClick={() => setShown(!shown)}
            type='button'>
            <Icon name={shown ? 'eyeOff' : 'eye'} size={20} />
          </button>
        )}
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
