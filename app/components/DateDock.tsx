'use client';

import { useState } from 'react';

import {
  MIN_DAY,
  type Precision,
  PRECISIONS,
  shownDate,
  stepDay,
} from '@/lib/map/map-date';

import { DateSlider } from './DateSlider';

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
    <section aria-label='Map date' className='dock'>
      <div className='dock-row'>
        <button
          aria-label='Back'
          className='dock-step'
          disabled={day <= MIN_DAY}
          onClick={() => onChange(stepDay(day, precision, -1, lastDay))}
          type='button'>
          ‹
        </button>
        <input
          aria-label='Date shown'
          className='dock-field mono'
          readOnly
          value={shownDate(day, precision)}
        />
        <button
          aria-label='Forward'
          className='dock-step'
          disabled={day >= lastDay}
          onClick={() => onChange(stepDay(day, precision, 1, lastDay))}
          type='button'>
          ›
        </button>
        <div aria-label='Precision' className='segmented' role='radiogroup'>
          {PRECISIONS.map(option => (
            <button
              aria-checked={option === precision}
              key={option}
              onClick={() => setPrecision(option)}
              role='radio'
              type='button'>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
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
