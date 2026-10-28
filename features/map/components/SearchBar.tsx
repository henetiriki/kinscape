'use client';

import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';

import { TextField } from '@ks/app/components/forms/TextField';
import { Wordmark } from '@ks/app/components/foundation/Wordmark';

import styles from '@ks/features/map/components/SearchBar.module.css';

const NAME = 'Search people and places';

// Sets the value the way typing does, so a controlled field hears the change.
const clear = (input: HTMLInputElement) => {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )!.set!.call(input, '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

// Esc clears the text and stops there, so the browser's own clear doesn't also fire; with none it leaves the field.
const onEscape = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key !== 'Escape') return;

  const input = event.currentTarget;

  if (input.value) {
    event.preventDefault();
    clear(input);
  } else input.blur();
};

/**
 * The map's search. `bar` is the desktop form: the Wordmark, a divider and the field, which owns "/".
 * `pill` is the phone's: the icon, the bare field and an `account` slot. It has no results.
 */
export const SearchBar = ({
  account,
  form,
  ...rest
}: {
  /** The pill's trailing slot: the Avatar. */
  account?: ReactNode;
  form: 'bar' | 'pill';
} & Omit<
  ComponentProps<'input'>,
  'aria-label' | 'className' | 'id' | 'onKeyDown' | 'size' | 'type'
>) => (
  <form
    className={form === 'bar' ? styles.bar : styles.pill}
    onSubmit={event => event.preventDefault()}
    role='search'>
    {form === 'bar' ? (
      <>
        <Wordmark size={32} />
        <span aria-hidden='true' className={styles.divider} />
        <span className={styles.field}>
          <TextField
            hideLabel
            label={NAME}
            onKeyDown={onEscape}
            placeholder={NAME}
            shortcut='/'
            type='search'
            {...rest}
          />
        </span>
      </>
    ) : (
      <>
        <Wordmark iconOnly size={32} />
        <input
          aria-label={NAME}
          className={styles.input}
          onKeyDown={onEscape}
          placeholder={NAME}
          type='search'
          {...rest}
        />
        {account}
      </>
    )}
  </form>
);
