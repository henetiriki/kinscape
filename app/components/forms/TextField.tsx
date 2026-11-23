'use client';

import type { ComponentProps, ReactNode, RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { KeyHint } from '@ks/app/components/actions/KeyHint';
import { useFieldMessage } from '@ks/app/components/forms/useFieldMessage';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/forms/TextField.module.css';

// A key typed in these is text, not a shortcut.
const TYPES_TEXT = 'input, select, textarea, [contenteditable]';

const useShortcutFocus = (
  shortcut: string | undefined,
  input: RefObject<HTMLInputElement | null>
) => {
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
  }, [input, shortcut]);
};

const useBox = (shortcut: string | undefined, defaultShown: boolean) => {
  const input = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(defaultShown);

  useShortcutFocus(shortcut, input);

  return { input, setShown, shown };
};

type BoxProps = {
  date?: 'fill' | boolean;
  describedBy: string | undefined;
  hideLabel?: boolean;
  id: string;
  input: RefObject<HTMLInputElement | null>;
  label: string;
  marked: 'error' | 'warning' | undefined;
  rest: Omit<ComponentProps<'input'>, 'className' | 'id' | 'size' | 'type'>;
  setShown: (shown: boolean) => void;
  shortcut?: string;
  shown: boolean;
  size?: 'l';
  state?: ControlState;
  type: 'email' | 'password' | 'search' | 'text';
};

const FieldBox = ({
  date,
  describedBy,
  hideLabel,
  id,
  input,
  label,
  marked,
  rest,
  setShown,
  shortcut,
  shown,
  size,
  state,
  type,
}: BoxProps) => (
  <span
    className={date ? `${styles.box} ${styles.date}` : styles.box}
    data-fill={date === 'fill' || undefined}
    data-mark={marked}
    data-size={size}
    data-state={state}
    data-testid='field-box'
    data-type={type === 'search' ? 'search' : undefined}>
    {type === 'search' && <Icon name='search' />}
    <input
      aria-keyshortcuts={shortcut}
      aria-label={hideLabel ? label : undefined}
      className={styles.input}
      {...rest}
      aria-describedby={describedBy}
      aria-invalid={marked === 'error' || undefined}
      id={id}
      ref={input}
      type={type === 'password' && shown ? 'text' : type}
    />
    {marked && <Icon name={marked} />}
    {type === 'search' && shortcut && <KeyHint decorative>{shortcut}</KeyHint>}
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
);

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
  const field = useFieldMessage({
    describedBy: rest['aria-describedby'],
    error,
    helper,
  });
  const { input, setShown, shown } = useBox(shortcut, defaultShown);

  return (
    <div className={styles.field}>
      {!hideLabel && (
        <Text as='label' htmlFor={field.id} variant='label'>
          {label}
        </Text>
      )}
      <FieldBox
        date={date}
        describedBy={field.describedBy}
        hideLabel={hideLabel}
        id={field.id}
        input={input}
        label={label}
        marked={error ? 'error' : mark}
        rest={rest}
        setShown={setShown}
        shortcut={shortcut}
        shown={shown}
        size={size}
        state={state}
        type={type}
      />
      {field.message}
    </div>
  );
};
