import type { Precision } from './types';

import { fromDay, toDay } from '../boundaries/model.mts';
import { dayOf } from './filter';

export const PRECISIONS: Precision[] = ['year', 'month', 'day'];

/** The finer of two precisions: day over month over year. */
export const finerPrecision = (a: Precision, b: Precision): Precision =>
  PRECISIONS[Math.max(PRECISIONS.indexOf(a), PRECISIONS.indexOf(b))];

/** The first Map date: 1652-01-01. */
export const MIN_DAY = 0;

const FIRST_YEAR = 1652;

/** The last Map date: today, in UTC. */
export const todayDay = (): number => dayOf(new Date());

const clamp = (day: number, max: number): number =>
  Math.min(Math.max(day, MIN_DAY), max);

const pad = (n: number, width: number): string =>
  String(n).padStart(width, '0');

const parts = (day: number): [number, number, number] => {
  const [year, month, date] = fromDay(day).split('-').map(Number);

  return [year, month, date];
};

/** The day for a year and month (which may run past 1–12), keeping `date` or the month's last day. */
const build = (year: number, month: number, date: number): number => {
  const index = year * 12 + (month - 1);
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();

  return toDay(
    pad(y, 4) + '-' + pad(m, 2) + '-' + pad(Math.min(date, last), 2)
  );
};

/** `day` moved by `count` steps of `precision`, kept between 1652-01-01 and `max`. */
export const stepDay = (
  day: number,
  precision: Precision,
  count: number,
  max: number
): number => {
  if (precision === 'day') return clamp(day + count, max);

  const [year, month, date] = parts(day);

  return clamp(
    precision === 'year'
      ? build(year + count, month, date)
      : build(year, month + count, date),
    max
  );
};

/** The slider's value for `day`, in steps of `precision` from 1652-01-01. */
export const sliderValue = (day: number, precision: Precision): number => {
  const [year, month] = parts(day);

  if (precision === 'day') return day;

  return precision === 'year'
    ? year - FIRST_YEAR
    : (year - FIRST_YEAR) * 12 + month - 1;
};

/** The slider's last value: the steps from 1652-01-01 to `max`. */
export const sliderMax = (precision: Precision, max: number): number =>
  sliderValue(max, precision);

/** The Map date for slider `value`, keeping the month and day of `day` where the precision allows. */
export const dayFromSlider = (
  value: number,
  day: number,
  precision: Precision,
  max: number
): number => {
  if (precision === 'day') return clamp(value, max);

  const [, month, date] = parts(day);

  return clamp(
    precision === 'year'
      ? build(FIRST_YEAR + value, month, date)
      : build(FIRST_YEAR, value + 1, date),
    max
  );
};

/** The full date over the slider thumb. */

/** The date in the field: `2026`, `2026-10` or `2026-10-21`. */
export const shownDate = (day: number, precision: Precision): string =>
  fromDay(day).slice(0, { day: 10, month: 7, year: 4 }[precision]);
