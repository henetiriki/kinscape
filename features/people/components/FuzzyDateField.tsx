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

type FuzzyDateFieldArgs = {
  /** Text to start with. The field checks it on the first render, unless `state` is `focus`. */
  defaultValue?: string;
  /** A problem that the caller found, such as an empty date. The slot shows it after the field's own error, until a check reads the date. */
  error?: ReactNode;
  /** The slot shows it while the text is empty or does not read as a date. */
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
>;

const useFuzzyText = (
  defaultValue: string,
  given: ReactNode,
  state: ControlState | undefined
) => {
  const [text, setText] = useState(defaultValue);
  const [own, setOwn] = useState<null | string>(() =>
    state === 'focus' ? null : problemOf(defaultValue)
  );
  // A check that reads a date drops the error of the caller, and an empty check brings it back.
  const [read, setRead] = useState(false);
  const error = own ?? (read ? undefined : given);
  // A new count at each check gives the error a new element, so a screen reader reads a repeat.
  const [checks, setChecks] = useState(0);
  const check = () => {
    const problem = problemOf(text);

    setOwn(problem);
    setRead(problem === null && text.trim() !== '');
    setChecks(count => count + 1);
  };

  return { check, checks, error, setText, text };
};

const Slot = ({
  checks,
  error,
  helper,
  id,
  text,
}: {
  checks: number;
  error: ReactNode;
  helper: ReactNode;
  id: string;
  text: string;
}) => {
  const parsed = parseFuzzyDate(text);

  return (
    <div aria-live='polite' data-testid='message-slot' id={id}>
      {error ? (
        <Text as='p' key={checks} role='alert' tone='error' variant='small'>
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
  );
};

/**
 * A GEDCOM date typed as text. Under the input, one slot shows the helper, the reading of a
 * date that parses, or the error. It checks on Enter or when focus leaves, never while the user types.
 * An error stays with the text until the next check.
 */
export const FuzzyDateField = (props: FuzzyDateFieldArgs) => {
  const {
    defaultValue = '',
    error: given,
    helper,
    label,
    state,
    ...rest
  } = props;
  const id = useId();
  const slotId = `${id}-slot`;
  const { check, checks, error, setText, text } = useFuzzyText(
    defaultValue,
    given,
    state
  );

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={id} variant='label'>
        {label}
      </Text>
      <label
        className={styles.box}
        data-mark={error ? 'error' : undefined}
        data-state={state}
        data-testid='field-box'>
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
            if (event.key !== 'Enter') return;

            // In a form, Enter also submits the date that the check rejects.
            if (problemOf(text) !== null) event.preventDefault();
            check();
          }}
          type='text'
          value={text}
        />
        {error && <Icon name='error' />}
      </label>
      <Slot
        checks={checks}
        error={error}
        helper={helper}
        id={slotId}
        text={text}
      />
    </div>
  );
};
