'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useEffect, useState } from 'react';

import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { Precision } from '@ks/lib/domain/map/types';
import type { ContestedYears, Epoch } from '@ks/lib/ui/types';

import { IconButton } from '@ks/app/components/actions/IconButton';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { BottomSheet } from '@ks/app/components/overlays/BottomSheet';
import { ContestedNote } from '@ks/features/map/components/ContestedNote';
import { DateField } from '@ks/features/map/components/DateField';
import { DateKeyHints } from '@ks/features/map/components/DateKeyHints';
import { DateSlider } from '@ks/features/map/components/DateSlider';
import { JumpTo } from '@ks/features/map/components/JumpTo';
import { PlayButton } from '@ks/features/map/components/PlayButton';
import { asDay, toDay } from '@ks/lib/domain/boundaries/model.mts';
import {
  finerPrecision,
  MIN_DAY,
  PRECISIONS,
  stepDay,
  yearOf,
} from '@ks/lib/domain/map/map-date.mts';

import styles from '@ks/features/map/components/DateDock.module.css';

const OPTIONS = PRECISIONS.map(precision => ({
  label: precision[0].toUpperCase() + precision.slice(1),
  value: precision,
}));

const NOTICE_MS = 4000;

const SPEEDS = ['1', '5', '10'].map(speed => ({ label: speed, value: speed }));

const Chevron = ({ path }: { path: string }) => (
  <svg
    aria-hidden='true'
    fill='none'
    height='16'
    role='img'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2.2'
    viewBox='0 0 24 24'
    width='16'>
    <path d={path} />
  </svg>
);

type Note = { forDay?: Day } & ComponentProps<typeof DateField>['notice'];

const useNote = (day: Day) => {
  // `forDay` ties the no-borders warning to the day it was set for.
  const [note, setNote] = useState<Note>();
  const notice =
    note?.forDay === undefined || note.forDay === day ? note : undefined;

  // Each switch shows its note for 4 seconds; a new switch restarts the timer.
  useEffect(() => {
    if (!note) return;

    const timer = setTimeout(() => setNote(undefined), NOTICE_MS);

    return () => clearTimeout(timer);
  }, [note]);

  return { notice, setNote };
};

type FieldArgs = Pick<
  DockProps,
  'day' | 'defaultText' | 'hasBorders' | 'lastDay' | 'onChange' | 'onPlay'
> & {
  notice?: Note;
  precision: Precision;
  setNote: (note: Note) => void;
  setPrecision: (precision: Precision) => void;
  sheet: boolean;
  speed: string;
};

const noteFor = (
  to: Day,
  at: Precision,
  precision: Precision,
  hasBorders: ((day: Day) => boolean) | undefined
): Note | undefined => {
  // The warning wins when a typed date needs both notes.
  if (hasBorders && !hasBorders(to)) {
    return {
      forDay: to,
      text: `No borders are mapped for ${yearOf(to)} yet.`,
      tone: 'warning',
    };
  }

  if (finerPrecision(at, precision) !== precision) {
    return { text: `Switched to ${at} precision.`, tone: 'info' };
  }
};

const DockField = ({
  day,
  defaultText,
  hasBorders,
  lastDay,
  notice,
  onChange,
  onPlay,
  precision,
  setNote,
  setPrecision,
  sheet,
  speed,
}: FieldArgs) => (
  <DateField
    after={
      <>
        <IconButton
          disabled={day >= lastDay}
          label='Forward'
          onClick={() => onChange(stepDay(day, precision, 1, lastDay))}>
          <Chevron path='M9 5l7 7-7 7' />
        </IconButton>
        {sheet && onPlay && (
          <span className={styles.sheetPlay}>
            <PlayButton onClick={() => onPlay(Number(speed))} round />
          </span>
        )}
      </>
    }
    before={
      <IconButton
        disabled={day <= MIN_DAY}
        label='Back'
        onClick={() => onChange(stepDay(day, precision, -1, lastDay))}>
        <Chevron path='M15 5l-7 7 7 7' />
      </IconButton>
    }
    day={day}
    defaultText={defaultText}
    fill={sheet}
    keepPrecision={sheet}
    max={lastDay}
    min={MIN_DAY}
    notice={notice}
    onChange={(to, at) => {
      const next = noteFor(to, at, precision, hasBorders);

      if (next) setNote(next);

      setPrecision(at);
      onChange(to);
    }}
    placement='above'
    precision={precision}
  />
);

const PlaySpeed = ({
  onPlay,
  setSpeed,
  speed,
}: {
  onPlay: (speed: number) => void;
  setSpeed: (speed: string) => void;
  speed: string;
}) => (
  <span className={styles.play}>
    <PlayButton onClick={() => onPlay(Number(speed))} />
    <Segmented
      label='Playback speed in years per second'
      name='speed'
      onChange={setSpeed}
      options={SPEEDS}
      value={speed}
    />
    <span className={styles.caption}>yr/s</span>
  </span>
);

const Footer = ({
  day,
  epochs,
  lastDay,
  onChange,
  precision,
}: {
  epochs?: Epoch[];
} & Pick<FieldArgs, 'day' | 'lastDay' | 'onChange' | 'precision'>) => (
  <div className={styles.footer}>
    {epochs && (
      <JumpTo
        current={yearOf(day)}
        epochs={epochs}
        onJump={year =>
          onChange(asDay(Math.min(toDay(`${year}-01-01`), lastDay)))
        }
      />
    )}
    <span className={styles.hints}>
      <DateKeyHints precision={precision} />
    </span>
  </div>
);

const useDockState = (day: Day) => {
  const [precision, setPrecision] = useState<Precision>('year');
  const [speed, setSpeed] = useState('5');
  const { notice, setNote } = useNote(day);

  return { notice, precision, setNote, setPrecision, setSpeed, speed };
};

type DockState = ReturnType<typeof useDockState>;

const SheetDock = ({
  children,
  details,
  field,
  sheet,
}: {
  children: ReactNode;
  details?: ReactNode;
  field: ReactNode;
  sheet: NonNullable<DockProps['sheet']>;
}) => (
  <BottomSheet
    expanded={sheet.expanded}
    onExpandedChange={sheet.onExpandedChange}>
    <div className={styles.sheetField}>{field}</div>
    {sheet.expanded && children}
    {details !== undefined && (
      <>
        <hr className={styles.rule} />
        {details}
      </>
    )}
  </BottomSheet>
);

const DesktopDock = ({
  contestedCount,
  day,
  epochs,
  field,
  lastDay,
  onChange,
  onPlay,
  precision,
  setPrecision,
  setSpeed,
  slider,
  speed,
}: {
  contestedCount?: number;
  epochs?: Epoch[];
  field: ReactNode;
  slider: ReactNode;
} & Pick<DockState, 'precision' | 'setPrecision' | 'setSpeed' | 'speed'> &
  Pick<FieldArgs, 'day' | 'lastDay' | 'onChange' | 'onPlay'>) => (
  <section aria-label='Map date' className={styles.dock}>
    <div className={styles.row}>
      {field}
      <Segmented
        label='Precision'
        name='precision'
        // Filtering narrows the string to a Precision without a cast.
        onChange={value =>
          PRECISIONS.filter(option => option === value).forEach(setPrecision)
        }
        options={OPTIONS}
        value={precision}
      />
      {contestedCount !== undefined && <ContestedNote count={contestedCount} />}
      {onPlay && (
        <PlaySpeed onPlay={onPlay} setSpeed={setSpeed} speed={speed} />
      )}
    </div>
    {slider}
    <Footer
      day={day}
      epochs={epochs}
      lastDay={lastDay}
      onChange={onChange}
      precision={precision}
    />
  </section>
);

type DockProps = {
  /** Contested claims on the Map date. */
  contestedCount?: number;
  /** Year spans drawn hatched on the slider. */
  contestedYears?: ContestedYears[];
  day: Day;
  /** Text the date field starts with instead of the date, checked on the first render. A design board sets it; the app does not. */
  defaultText?: string;
  /** The phone sheet only: content under the slider, such as the Pin popup. The sheet shows it when expanded. */
  details?: ReactNode;
  /** Epochs for Jump to; they are also the slider's ticks. */
  epochs?: Epoch[];
  /** Whether a Boundary version is valid on a day; a typed date without one shows the warning. */
  hasBorders?: (day: Day) => boolean;
  lastDay: Day;
  onChange: (day: Day) => void;
  /** Play pressed, with the speed in years per second. */
  onPlay?: (speed: number) => void;
  /** The phone sheet instead of the dock. */
  sheet?: { expanded: boolean; onExpandedChange: (expanded: boolean) => void };
};

/**
 * The Map date control. On desktop a dock: steps, the typed date, precision, then the optional contested note, Play and speed, the slider, Jump to and key hints.
 * With `sheet` it is the phone's bottom sheet: the stepper and round Play, and the slider once expanded.
 * The Play, Jump to and contested parts show only when their props are passed.
 */
export const DateDock = (props: DockProps) => {
  const { contestedYears, day, details, epochs, lastDay, onChange, sheet } =
    props;
  const state = useDockState(day);
  const field = <DockField {...props} {...state} sheet={!!sheet} />;
  const slider = (
    <DateSlider
      contested={contestedYears}
      day={day}
      lastDay={lastDay}
      onChange={onChange}
      precision={state.precision}
      ticks={epochs?.map(epoch => epoch.year)}
    />
  );

  if (sheet) {
    return (
      <SheetDock details={details} field={field} sheet={sheet}>
        {slider}
      </SheetDock>
    );
  }

  return <DesktopDock {...props} {...state} field={field} slider={slider} />;
};
