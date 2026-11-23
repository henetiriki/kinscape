'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useId, useState } from 'react';

import type { ControlState, Tone } from '@ks/app/components/foundation/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { Precision, Problem } from '@ks/lib/domain/map/types';

import { TextLink } from '@ks/app/components/actions/TextLink';
import { Callout, CalloutPointer } from '@ks/app/components/feedback/Callout';
import { TextField } from '@ks/app/components/forms/TextField';
import { Text } from '@ks/app/components/foundation/Text';
import { useDismiss } from '@ks/app/components/overlays/useDismiss';
import { checkDate } from '@ks/lib/domain/map/date-input.mts';
import { finerPrecision, shownDate } from '@ks/lib/domain/map/map-date.mts';

import styles from '@ks/features/map/components/DateField.module.css';

type DateFieldArgs = {
  /** Beside the field on the right: the step forward button. */
  after?: ReactNode;
  /** Beside the field on the left: the step back button. */
  before?: ReactNode;
  /** The last good date: what the map shows. */
  day: Day;
  /** Text to start with instead of the date; it is checked on the first render, unless `state` is `focus`. */
  defaultText?: string;
  /** The field takes the width the row leaves, as in the phone date sheet. */
  fill?: boolean;
  /** A typed date or a fix commits at the field's precision, never a finer one. */
  keepPrecision?: boolean;
  /** The last Map date: today. */
  max: Day;
  /** The first Map date. */
  min: Day;
  /** Something the app did, shown while it is passed; the caller clears it. */
  notice?: Notice;
  onChange: (day: Day, precision: Precision) => void;
  /** `above` opens the message over the field, for the dock at the bottom of the screen. */
  placement?: 'above' | 'below';
  precision: Precision;
  state?: ControlState;
};

type DateText = ReturnType<typeof useDateText>;

type DateTextArgs = Pick<
  DateFieldArgs,
  | 'day'
  | 'defaultText'
  | 'keepPrecision'
  | 'max'
  | 'min'
  | 'onChange'
  | 'precision'
  | 'state'
>;

type GoTo = (to: Day, wanted: Precision) => void;

type Notice = { text: string; tone: Extract<Tone, 'info' | 'warning'> };

const DateInput = ({
  above,
  fill,
  notice,
  state,
  text: t,
}: {
  above: boolean;
  text: DateText;
} & Pick<DateFieldArgs, 'fill' | 'notice' | 'state'>) => (
  <span
    className={styles.anchor}
    data-fill={fill || undefined}
    data-testid='date-anchor'>
    <TextField
      aria-describedby={t.problem || notice ? t.messageId : undefined}
      date={fill ? 'fill' : true}
      hideLabel
      label='Date shown'
      mark={
        t.problem ? 'error' : notice?.tone === 'warning' ? 'warning' : undefined
      }
      onBlur={t.commit}
      onChange={event => t.setText(event.target.value)}
      onKeyDown={t.onKeyDown}
      state={state}
      value={t.text}
    />
    {t.problem && above && <CalloutPointer className={styles.pointer} />}
  </span>
);

/**
 * The typed Map date. It checks on Enter or when focus leaves, never while typing.
 * A bad date stays in the field with its problem until the next check; Esc puts the last good date back.
 */
export const DateField = (props: DateFieldArgs) => {
  const { after, before, fill, notice, placement = 'below', state } = props;
  const text = useDateText(props);
  const { goTo, messageId, problem, shown } = text;
  const above = placement === 'above';

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {before}
        <DateInput
          above={above}
          fill={fill}
          notice={notice}
          state={state}
          text={text}
        />
        {after}
        {problem && above && (
          <ProblemCallout
            goTo={goTo}
            messageId={messageId}
            problem={problem}
            shown={shown}
          />
        )}
      </div>
      <Below
        above={above}
        goTo={goTo}
        messageId={messageId}
        notice={notice}
        problem={problem}
      />
    </div>
  );
};

const useDateText = ({
  day,
  defaultText,
  keepPrecision,
  max,
  min,
  onChange,
  precision,
  state,
}: DateTextArgs) => {
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
  // A problem from a check, not from `defaultText`: only it listens for Esc on the page.
  const [checked, setChecked] = useState(false);
  const [seen, setSeen] = useState(shown);
  // Shows `to` in the field and drops any problem.
  const clear = (to: string) => {
    setText(to);
    setProblem(null);
    setChecked(false);
  };

  // The date changed from outside the field (a step, the slider): drop what was typed and any problem.
  if (seen !== shown) {
    setSeen(shown);
    clear(shown);
  }

  // Esc restores the last good date after focus has left the field, unless another control owns that Esc.
  useDismiss(problem !== null && checked, () => clear(shown), { escape: true });

  const goTo = (to: Day, wanted: Precision) => {
    const at = keepPrecision ? precision : wanted;

    clear(shownDate(to, at));

    if (to !== day || at !== precision) onChange(to, at);
  };

  const commit = () => {
    if (text === shown && !problem) return;

    const result = checkDate(text, min, max);

    if (result.ok)
      goTo(result.day, finerPrecision(result.precision, precision));
    else {
      setProblem(result.problem);
      setChecked(true);
    }
  };

  const onKeyDown: ComponentProps<'input'>['onKeyDown'] = event => {
    if (event.key === 'Enter') commit();

    if (event.key === 'Escape') clear(shown);
  };

  return { commit, goTo, messageId, onKeyDown, problem, setText, shown, text };
};

const ProblemCallout = ({
  goTo,
  messageId,
  problem,
  shown,
}: {
  goTo: GoTo;
  messageId: string;
  problem: Problem;
  shown: string;
}) => (
  <Callout className={styles.callout} id={messageId}>
    <span>
      <strong>{problem.message}</strong> The map still shows {shown}.
      <span className={styles.esc}> Press Esc to go back to it.</span>
    </span>
    {problem.fix && (
      <span className={`${styles.fix} ${styles.phoneFix}`}>
        <TextLink
          onClick={() => goTo(problem.fix!.day, problem.fix!.precision)}
          size='small'>
          {problem.fix.label}
        </TextLink>
      </span>
    )}
  </Callout>
);

const Below = ({
  above,
  goTo,
  messageId,
  notice,
  problem,
}: {
  above: boolean;
  goTo: GoTo;
  messageId: string;
  notice?: Notice;
  problem: null | Problem;
}) => (
  <>
    {problem && !above && (
      <Text id={messageId} role='alert' tone='error' variant='small'>
        {problem.message}
      </Text>
    )}
    {problem?.fix && !above && (
      <span className={styles.fix}>
        <TextLink
          onClick={() => goTo(problem.fix!.day, problem.fix!.precision)}
          size='small'>
          {problem.fix.label}
        </TextLink>
      </span>
    )}
    {!problem && notice && (
      <Text id={messageId} role='status' tone={notice.tone} variant='small'>
        {notice.text}
      </Text>
    )}
  </>
);
