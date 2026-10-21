'use client';

import {
  dayFromSlider,
  type Precision,
  sliderMax,
  sliderValue,
} from '@/lib/map/map-date';

import styles from './DateSlider.module.css';

/**
 * The 1652-to-today slider. The thumb moves in steps of `precision`.
 */
export const DateSlider = ({
  day,
  lastDay,
  onChange,
  precision,
}: {
  day: number;
  lastDay: number;
  onChange: (day: number) => void;
  precision: Precision;
}) => {
  const max = sliderMax(precision, lastDay);
  const value = sliderValue(day, precision);

  return (
    <div className={styles.slider}>
      <input
        aria-label='Map date'
        max={max}
        min={0}
        onChange={event =>
          onChange(
            dayFromSlider(Number(event.target.value), day, precision, lastDay)
          )
        }
        step={1}
        type='range'
        value={value}
      />
    </div>
  );
};
