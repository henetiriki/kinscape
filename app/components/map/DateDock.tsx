'use client';

import { type ComponentProps, useEffect, useState } from 'react';

import { IconButton } from '@/app/components/actions/IconButton';
import { Segmented } from '@/app/components/actions/Segmented';
import { DateField } from '@/app/components/forms/DateField';
import { ContestedNote } from '@/app/components/map/ContestedNote';
import { DateKeyHints } from '@/app/components/map/DateKeyHints';
import {
  type ContestedYears,
  DateSlider,
} from '@/app/components/map/DateSlider';
import { type Epoch, JumpTo } from '@/app/components/map/JumpTo';
import { PlayButton } from '@/app/components/map/PlayButton';
import { BottomSheet } from '@/app/components/overlays/BottomSheet';
import { fromDay, toDay } from '@/lib/boundaries/model.mts';
import {
  finerPrecision,
  MIN_DAY,
  type Precision,
  PRECISIONS,
  stepDay,
} from '@/lib/map/map-date';

import styles from './DateDock.module.css';

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
  lastDay: number;
  onChange: (day: number) => void;
  /** Play pressed, with the speed in years per second. */
  onPlay?: (speed: number) => void;
  /** The phone sheet instead of the dock. */
  sheet?: { expanded: boolean; onExpandedChange: (expanded: boolean) => void };
}) => {
  const [precision, setPrecision] = useState<Precision>('year');
  const [speed, setSpeed] = useState('5');
  const [notice, setNotice] =
    useState<ComponentProps<typeof DateField>['notice']>();

  // Each switch shows its note for 4 seconds; a new switch restarts the timer.
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(undefined), NOTICE_MS);

    return () => clearTimeout(timer);
  }, [notice]);

  const field = (
    <DateField
      after={
        <IconButton
          disabled={day >= lastDay}
          label='Forward'
          onClick={() => onChange(stepDay(day, precision, 1, lastDay))}>
          <Chevron path='M9 5l7 7-7 7' />
        </IconButton>
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
        if (finerPrecision(at, precision) !== precision) {
          setNotice({ text: `Switched to ${at} precision.`, tone: 'info' });
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
        <div className={styles.sheetRow}>
          {field}
          {onPlay && <PlayButton onClick={() => onPlay(Number(speed))} round />}
        </div>
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
