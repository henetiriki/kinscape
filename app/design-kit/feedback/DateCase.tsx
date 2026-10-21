'use client';

import { type ComponentProps, useState } from 'react';

import { DateField } from '@/app/components/DateField';
import { IconButton } from '@/app/components/IconButton';
import { Segmented } from '@/app/components/Segmented';
import { MIN_DAY, type Precision, stepDay, todayDay } from '@/lib/map/map-date';

import styles from './page.module.css';

const BACK = 'M15 5l-7 7 7 7';
const FORWARD = 'M9 5l7 7-7 7';

const Chevron = ({ path }: { path: string }) => (
  <svg
    aria-hidden='true'
    fill='none'
    height='14'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2.4'
    viewBox='0 0 24 24'
    width='14'>
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
 * In a card the step buttons are drawn boxes; in the dock they step by a day, beside Year / Month / Day.
 */
export const DateCase = ({
  dock,
  initial,
  ...field
}: {
  dock?: boolean;
  initial: { day: number; precision: Precision };
} & Pick<
  ComponentProps<typeof DateField>,
  'defaultText' | 'notice' | 'placement' | 'state'
>) => {
  const [{ day, precision }, setDate] = useState(initial);
  const max = todayDay();
  const step = (count: number) =>
    setDate({ day: stepDay(day, 'day', count, max), precision });

  const input = (
    <DateField
      {...field}
      after={
        dock ? (
          <IconButton
            disabled={day >= max}
            label='Forward one day'
            onClick={() => step(1)}>
            <Chevron path={FORWARD} />
          </IconButton>
        ) : (
          <span aria-hidden='true' className={styles.step}>
            <Chevron path={FORWARD} />
          </span>
        )
      }
      before={
        dock ? (
          <IconButton
            disabled={day <= MIN_DAY}
            label='Back one day'
            onClick={() => step(-1)}>
            <Chevron path={BACK} />
          </IconButton>
        ) : (
          <span aria-hidden='true' className={styles.step}>
            <Chevron path={BACK} />
          </span>
        )
      }
      day={day}
      max={max}
      min={MIN_DAY}
      onChange={(to, at) => setDate({ day: to, precision: at })}
      precision={precision}
    />
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
