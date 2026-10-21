'use client';

import { useState } from 'react';

import {
  MIN_DAY,
  type Precision,
  PRECISIONS,
  shownDate,
  stepDay,
} from '@/lib/map/map-date';

import styles from './DateDock.module.css';
import { DateSlider } from './DateSlider';
import { IconButton } from './IconButton';
import { Segmented } from './Segmented';

const OPTIONS = PRECISIONS.map(precision => ({
  label: precision[0].toUpperCase() + precision.slice(1),
  value: precision,
}));

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

export const DateDock = ({
  day,
  lastDay,
  onChange,
}: {
  day: number;
  lastDay: number;
  onChange: (day: number) => void;
}) => {
  const [precision, setPrecision] = useState<Precision>('year');

  return (
    <section aria-label='Map date' className={styles.dock}>
      <div className={styles.row}>
        <IconButton
          disabled={day <= MIN_DAY}
          label='Back'
          onClick={() => onChange(stepDay(day, precision, -1, lastDay))}>
          <Chevron path='M15 5l-7 7 7 7' />
        </IconButton>
        <input
          aria-label='Date shown'
          className={styles.field}
          readOnly
          value={shownDate(day, precision)}
        />
        <IconButton
          disabled={day >= lastDay}
          label='Forward'
          onClick={() => onChange(stepDay(day, precision, 1, lastDay))}>
          <Chevron path='M9 5l7 7-7 7' />
        </IconButton>
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
      </div>
      <DateSlider
        day={day}
        lastDay={lastDay}
        onChange={onChange}
        precision={precision}
      />
    </section>
  );
};
