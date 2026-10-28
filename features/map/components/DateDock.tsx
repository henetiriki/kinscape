'use client';

import type { ComponentProps } from 'react';

import { useEffect, useState } from 'react';

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
import { fromDay, toDay } from '@ks/lib/domain/boundaries/model.mts';
import {
  finerPrecision,
  MIN_DAY,
  PRECISIONS,
  stepDay,
} from '@ks/lib/domain/map/map-date';

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
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2.2'
    viewBox='0 0 24 24'
    width='16'>
    <path d={path} />
  </svg>
);

/**
 * The Map date control. On desktop a dock: steps, the typed date, precision, then the optional contested note, Play and speed, the slider, Jump to and key hints.
 * With `sheet` it is the phone's bottom sheet: the stepper and round Play, and the slider once expanded.
 * The Play, Jump to and contested parts show only when their props are passed.
 */
export const DateDock = ({
  contestedCount,
  contestedYears,
  day,
  epochs,
  hasBorders,
  lastDay,
  onChange,
  onPlay,
  sheet,
}: {
  /** Contested claims on the Map date. */
  contestedCount?: number;
  /** Year spans drawn hatched on the slider. */
  contestedYears?: ContestedYears[];
  day: number;
  /** Epochs for Jump to; they are also the slider's ticks. */
  epochs?: Epoch[];
  /** Whether a Boundary version is valid on a day; a typed date without one shows the warning. */
  hasBorders?: (day: number) => boolean;
  lastDay: number;
  onChange: (day: number) => void;
  /** Play pressed, with the speed in years per second. */
  onPlay?: (speed: number) => void;
  /** The phone sheet instead of the dock. */
  sheet?: { expanded: boolean; onExpandedChange: (expanded: boolean) => void };
}) => {
  const [precision, setPrecision] = useState<Precision>('year');
  const [speed, setSpeed] = useState('5');
  // `forDay` ties the no-borders warning to the day it was set for.
  const [note, setNote] = useState<
    { forDay?: number } & ComponentProps<typeof DateField>['notice']
  >();
  const notice =
    note?.forDay === undefined || note.forDay === day ? note : undefined;

  // Each switch shows its note for 4 seconds; a new switch restarts the timer.
  useEffect(() => {
    if (!note) return;

    const timer = setTimeout(() => setNote(undefined), NOTICE_MS);

    return () => clearTimeout(timer);
  }, [note]);

  const field = (
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
            <PlayButton onClick={() => onPlay(Number(speed))} round />
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
      fill={!!sheet}
      keepPrecision={!!sheet}
      max={lastDay}
      min={MIN_DAY}
      notice={notice}
      onChange={(to, at) => {
        // The warning wins when a typed date needs both notes.
        if (hasBorders && !hasBorders(to)) {
          setNote({
            forDay: to,
            text: `No borders are mapped for ${fromDay(to).slice(0, 4)} yet.`,
            tone: 'warning',
          });
        } else if (finerPrecision(at, precision) !== precision) {
          setNote({ text: `Switched to ${at} precision.`, tone: 'info' });
        }

        setPrecision(at);
        onChange(to);
      }}
      placement='above'
      precision={precision}
    />
  );
  const slider = (
    <DateSlider
      contested={contestedYears}
      day={day}
      lastDay={lastDay}
      onChange={onChange}
      precision={precision}
      ticks={epochs?.map(epoch => epoch.year)}
    />
  );

  if (sheet)
    return (
      <BottomSheet
        expanded={sheet.expanded}
        onExpandedChange={sheet.onExpandedChange}>
        <div className={styles.sheetField}>{field}</div>
        {sheet.expanded && slider}
      </BottomSheet>
    );

  return (
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
        {contestedCount !== undefined && (
          <ContestedNote count={contestedCount} />
        )}
        {onPlay && (
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
        )}
      </div>
      {slider}
      <div className={styles.footer}>
        {epochs && (
          <JumpTo
            current={Number(fromDay(day).slice(0, 4))}
            epochs={epochs}
            onJump={year => onChange(Math.min(toDay(`${year}-01-01`), lastDay))}
          />
        )}
        <span className={styles.hints}>
          <DateKeyHints precision={precision} />
        </span>
      </div>
    </section>
  );
};
