'use client';

import type { CSSProperties } from 'react';

import { hatchStyle } from '@/app/components/map/hatch';
import { fromDay, toDay } from '@/lib/boundaries/model.mts';
import {
  dayFromSlider,
  type Precision,
  sliderMax,
  sliderValue,
} from '@/lib/map/map-date';

import styles from './DateSlider.module.css';

const FIRST_YEAR = 1652;
const LABEL_EVERY = 50;
/** A year label closer than this to the end gives way to "Today". */
const LABEL_GAP = 0.05;
const SHIFT_STEPS = 10;

export type ContestedYears = { from: number; to: number };

/** Where a mark sits along the slider, 0 to 1, as the thumb would. */
const at = (year: number, precision: Precision, lastDay: number): number => {
  const max = sliderMax(precision, lastDay);

  return (
    Math.min(
      Math.max(
        sliderValue(toDay(`${String(year).padStart(4, '0')}-01-01`), precision),
        0
      ),
      max
    ) / max
  );
};

const mark = (f: number) => ({ '--f': f }) as CSSProperties;

/**
 * The 1652-to-today slider. The thumb moves in steps of `precision`; Shift and an arrow move ten.
 * `ticks` are epoch years, `contested` year spans drawn hatched; the labels are 1652, every 50th year and Today.
 * The marks are decorative: the field and Jump to carry the same dates.
 */
export const DateSlider = ({
  contested = [],
  day,
  lastDay,
  onChange,
  precision,
  ticks = [],
}: {
  contested?: ContestedYears[];
  day: number;
  lastDay: number;
  onChange: (day: number) => void;
  precision: Precision;
  ticks?: number[];
}) => {
  const max = sliderMax(precision, lastDay);
  const value = sliderValue(day, precision);
  const lastYear = Number(fromDay(lastDay).slice(0, 4));
  const years: number[] = [];

  for (
    let year = Math.floor(FIRST_YEAR / LABEL_EVERY + 1) * LABEL_EVERY;
    year <= lastYear;
    year += LABEL_EVERY
  )
    if ((lastYear - year) / (lastYear - FIRST_YEAR) >= LABEL_GAP)
      years.push(year);

  const move = (to: number) =>
    onChange(dayFromSlider(to, day, precision, lastDay));

  return (
    <div className={styles.slider} style={hatchStyle}>
      <div aria-hidden='true' className={styles.marks}>
        <span className={styles.track} />
        {contested.map(({ from, to }) => (
          <span
            className={styles.contested}
            data-from={from}
            data-to={to}
            key={`${from}-${to}`}
            style={
              {
                '--f': at(from, precision, lastDay),
                '--g': at(to + 1, precision, lastDay),
              } as CSSProperties
            }
          />
        ))}
        {ticks.map(year => (
          <span
            className={styles.tick}
            data-year={year}
            key={year}
            style={mark(at(year, precision, lastDay))}
          />
        ))}
        <span className={styles.years}>
          <span className={styles.first}>{FIRST_YEAR}</span>
          {years.map(year => (
            <span key={year} style={mark(at(year, precision, lastDay))}>
              {year}
            </span>
          ))}
          <span className={styles.last}>Today</span>
        </span>
      </div>
      <input
        aria-keyshortcuts='Shift+ArrowLeft Shift+ArrowRight'
        aria-label='Map date'
        max={max}
        min={0}
        onChange={event => move(Number(event.target.value))}
        onKeyDown={event => {
          const sign = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

          if (!event.shiftKey || !sign) return;

          event.preventDefault();
          move(Math.min(Math.max(value + sign * SHIFT_STEPS, 0), max));
        }}
        step={1}
        type='range'
        value={value}
      />
    </div>
  );
};
