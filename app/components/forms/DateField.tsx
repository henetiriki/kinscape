'use client';

import { type ComponentProps, type ReactNode, useId, useState } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { Callout, CalloutPointer } from '@/app/components/feedback/Callout';
import { TextField } from '@/app/components/forms/TextField';
import { Text, type Tone } from '@/app/components/foundation/Text';
import { checkDate, type Problem } from '@/lib/map/date-input';
import { type Precision, shownDate } from '@/lib/map/map-date';

import styles from './DateField.module.css';

type Notice = { text: string; tone: Extract<Tone, 'info' | 'warning'> };

/**
 * The typed Map date. It checks on Enter or when focus leaves, never while typing.
 * A bad date stays in the field with its problem until the next check; Esc puts the last good date back.
 */
export const DateField = ({
  after,
  before,
  day,
  defaultText,
  fill,
  max,
  min,
  notice,
  onChange,
  placement = 'below',
  precision,
  state,
}: {
  /** Beside the field on the right: the step forward button. */
  after?: ReactNode;
  /** Beside the field on the left: the step back button. */
  before?: ReactNode;
  /** The last good date: what the map shows. */
  day: number;
  /** Text to start with instead of the date; it is checked on the first render, unless `state` is `focus`. */
  defaultText?: string;
  /** The field takes the width the row leaves, as in the phone date sheet. */
  fill?: boolean;
  /** The last Map date: today. */
  max: number;
  /** The first Map date. */
  min: number;
  /** Something the app did, shown while it is passed; the caller clears it. */
  notice?: Notice;
  onChange: (day: number, precision: Precision) => void;
  /** `above` opens the message over the field, for the dock at the bottom of the screen. */
  placement?: 'above' | 'below';
  precision: Precision;
  state?: ControlState;
}) => {
  const messageId = useId();
  const shown = shownDate(day, precision);
  const [text, setText] = useState(defaultText ?? shown);
  const [problem, setProblem] = useState<null | Problem>(() => {
    const first =
      defaultText === undefined || state === 'focus'
        ? undefined
        : checkDate(defaultText, min, max);

    return first && !first.ok ? first.problem : null;
  });
  const [seen, setSeen] = useState(shown);

  // The date changed from outside the field (a step, the slider): drop what was typed and any problem.
  if (seen !== shown) {
    setSeen(shown);
    setText(shown);
    setProblem(null);
  }

  const goTo = (to: number, at: Precision) => {
    setProblem(null);
    setText(shownDate(to, at));

    if (to !== day || at !== precision) onChange(to, at);
  };

  const commit = () => {
    if (text === shown && !problem) return;

    const result = checkDate(text, min, max);

    if (result.ok) goTo(result.day, result.precision);
    else setProblem(result.problem);
  };

  const onKeyDown: ComponentProps<'input'>['onKeyDown'] = event => {
    if (event.key === 'Enter') commit();

    if (event.key === 'Escape') {
      setText(shown);
      setProblem(null);
    }
  };

  const above = placement === 'above';
  const mark = problem
    ? 'error'
    : notice?.tone === 'warning'
      ? 'warning'
      : undefined;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {before}
        <span className={styles.anchor} data-fill={fill || undefined}>
          <TextField
            aria-describedby={problem || notice ? messageId : undefined}
            date={fill ? 'fill' : true}
            hideLabel
            label='Date shown'
            mark={mark}
            onBlur={commit}
            onChange={event => setText(event.target.value)}
            onKeyDown={onKeyDown}
            state={state}
            value={text}
          />
          {problem && above && <CalloutPointer className={styles.pointer} />}
        </span>
        {after}
        {problem && above && (
          <Callout className={styles.callout} id={messageId}>
            <span>
              <strong>{problem.message}</strong> The map still shows {shown}.
              <span className={styles.esc}> Press Esc to go back to it.</span>
            </span>
            {problem.fix && (
              <button
                className={`${styles.fix} ${styles.phoneFix}`}
                onClick={() => goTo(problem.fix!.day, problem.fix!.precision)}
                type='button'>
                {problem.fix.label}
              </button>
            )}
          </Callout>
        )}
      </div>
      {problem && !above && (
        <Text id={messageId} role='alert' tone='error' variant='small'>
          {problem.message}
        </Text>
      )}
      {problem?.fix && !above && (
        <button
          className={styles.fix}
          onClick={() => goTo(problem.fix!.day, problem.fix!.precision)}
          type='button'>
          {problem.fix.label}
        </button>
      )}
      {!problem && notice && (
        <Text id={messageId} role='status' tone={notice.tone} variant='small'>
          {notice.text}
        </Text>
      )}
    </div>
  );
};
