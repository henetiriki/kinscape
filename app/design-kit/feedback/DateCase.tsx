'use client';

import type { ComponentProps } from 'react';

import { useState } from 'react';

import type { Precision } from '@/lib/map/map-date';

import { Button } from '@/app/components/actions/Button';
import { IconButton } from '@/app/components/actions/IconButton';
import { Segmented } from '@/app/components/actions/Segmented';
import { DateField } from '@/app/components/forms/DateField';
import { MIN_DAY, stepDay, todayDay } from '@/lib/map/map-date';

import styles from './page.module.css';

const BACK = 'M15 5l-7 7 7 7';
const FORWARD = 'M9 5l7 7-7 7';

const Chevron = ({ path, size }: { path: string; size: number }) => (
  <svg
    aria-hidden='true'
    fill='none'
    height={size}
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width={size}>
    <path d={path} />
  </svg>
);

const PRECISION_OPTIONS = [
  { label: 'Year', value: 'year' },
  { label: 'Month', value: 'month' },
  { label: 'Day', value: 'day' },
];

/**
 * A live Map date field that holds its own last good date.
 * In a card the step buttons are drawn boxes; in the dock and the sheet they step by a day.
 */
export const DateCase = ({
  dock,
  initial,
  sheet,
  ...field
}: {
  dock?: boolean;
  initial: { day: number; precision: Precision };
  /** The phone date sheet: the field fills the row and a round Play button ends it. */
  sheet?: boolean;
} & Pick<
  ComponentProps<typeof DateField>,
  'defaultText' | 'notice' | 'placement' | 'state'
>) => {
  const [{ day, precision }, setDate] = useState(initial);
  const max = todayDay();
  const step = (count: number) =>
    setDate({ day: stepDay(day, 'day', count, max), precision });

  const live = dock || sheet;
  const input = (
    <DateField
      {...field}
      after={
        live ? (
          <>
            <IconButton
              disabled={day >= max}
              label='Forward one day'
              onClick={() => step(1)}>
              <Chevron path={FORWARD} size={16} />
            </IconButton>
            {sheet && (
              <Button
                icon='play'
                label='Play through time'
                round
                variant='primary'
              />
            )}
          </>
        ) : (
          <span aria-hidden='true' className={styles.step}>
            <Chevron path={FORWARD} size={14} />
          </span>
        )
      }
      before={
        live ? (
          <IconButton
            disabled={day <= MIN_DAY}
            label='Back one day'
            onClick={() => step(-1)}>
            <Chevron path={BACK} size={16} />
          </IconButton>
        ) : (
          <span aria-hidden='true' className={styles.step}>
            <Chevron path={BACK} size={14} />
          </span>
        )
      }
      day={day}
      fill={sheet}
      max={max}
      min={MIN_DAY}
      onChange={(to, at) => setDate({ day: to, precision: at })}
      precision={precision}
    />
  );

  if (sheet)
    return (
      <div className={styles.sheet}>
        <span aria-hidden='true' className={styles.grabber} />
        {input}
      </div>
    );

  return dock ? (
    <div className={styles.dock}>
      {input}
      <Segmented
        label='Precision'
        name='dock-precision'
        options={PRECISION_OPTIONS}
        value='day'
      />
    </div>
  ) : (
    input
  );
};
