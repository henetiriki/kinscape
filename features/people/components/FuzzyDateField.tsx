'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useId, useState } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';
import {
  fuzzyDateMessage,
  readFuzzyDate,
} from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';

import styles from '@ks/features/people/components/FuzzyDateField.module.css';

/** The message of an error for `text`, or null when `text` is empty or reads as a date. */
const problemOf = (text: string): null | string => {
  if (text.trim() === '') return null;
  const result = parseFuzzyDate(text);

  return result.ok ? null : fuzzyDateMessage(result.error, text);
};

/**
 * A GEDCOM date typed as text. Under the input, one slot shows the helper, the reading of a
 * date that parses, or the error. It checks on Enter or when focus leaves, never while typing.
 * An error stays with the text until the next check.
 */
export const FuzzyDateField = ({
  defaultValue = '',
  helper,
  label,
  state,
  ...rest
}: {
  /** Text to start with; it is checked on the first render, unless `state` is `focus`. */
  defaultValue?: string;
  /** Shown while the text is empty or does not read as a date yet. */
  helper?: ReactNode;
  label: string;
  state?: ControlState;
} & Omit<
  ComponentProps<'input'>,
  | 'className'
  | 'defaultValue'
  | 'id'
  | 'onBlur'
  | 'onChange'
  | 'onKeyDown'
  | 'type'
  | 'value'
>) => {
  const id = useId();
  const slotId = `${id}-slot`;
  const [text, setText] = useState(defaultValue);
  const [error, setError] = useState<null | string>(() =>
    state === 'focus' ? null : problemOf(defaultValue)
  );
  const parsed = parseFuzzyDate(text);
  const check = () => setError(problemOf(text));

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={id} variant='label'>
        {label}
      </Text>
      <span
        className={styles.box}
        data-mark={error ? 'error' : undefined}
        data-state={state}>
        <input
          {...rest}
          aria-describedby={[rest['aria-describedby'], slotId]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? true : undefined}
          className={styles.input}
          id={id}
          onBlur={check}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') check();
          }}
          type='text'
          value={text}
        />
        {error && <Icon name='error' />}
      </span>
      <div aria-live='polite' id={slotId}>
        {error ? (
          <Text as='p' role='alert' tone='error' variant='small'>
            {error}
          </Text>
        ) : parsed.ok ? (
          <Text as='p' variant='small'>
            Reads as{' '}
            <strong className={styles.reading}>
              {readFuzzyDate(parsed.value)}
            </strong>
          </Text>
        ) : (
          helper && (
            <Text as='p' variant='small'>
              {helper}
            </Text>
          )
        )}
      </div>
    </div>
  );
};
