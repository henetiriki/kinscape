import { describe, expect, it } from 'vitest';

import { fromDay, toDay } from '../../boundaries/model.mts';
import {
  dayFromSlider,
  MIN_DAY,
  shownDate,
  sliderMax,
  sliderValue,
  stepDay,
  todayDay,
} from '../map-date';

const today = toDay('2026-10-21');

describe('stepDay', () => {
  // MAP-03
  it('steps forward from 2020-03-15 by the precision', () => {
    const day = toDay('2020-03-15');

    expect(fromDay(stepDay(day, 'year', 1, today))).toBe('2021-03-15');
    expect(fromDay(stepDay(day, 'month', 1, today))).toBe('2020-04-15');
    expect(fromDay(stepDay(day, 'day', 1, today))).toBe('2020-03-16');
  });

  it('steps back', () => {
    const day = toDay('2020-03-15');

    expect(fromDay(stepDay(day, 'year', -1, today))).toBe('2019-03-15');
    expect(fromDay(stepDay(day, 'month', -3, today))).toBe('2019-12-15');
    expect(fromDay(stepDay(day, 'day', -15, today))).toBe('2020-02-29');
  });

  it('moves 29 February to 28 February at Year', () => {
    expect(fromDay(stepDay(toDay('2020-02-29'), 'year', 1, today))).toBe(
      '2021-02-28'
    );
  });

  it('stops at 1652-01-01 and the last date', () => {
    expect(stepDay(MIN_DAY, 'year', -1, today)).toBe(MIN_DAY);
    expect(stepDay(today, 'day', 1, today)).toBe(today);
    expect(stepDay(toDay('2026-09-30'), 'month', 1, today)).toBe(today);
  });
});

describe('slider', () => {
  it('counts steps from 1652-01-01', () => {
    expect(sliderMax('year', today)).toBe(374);
    expect(sliderMax('month', today)).toBe(374 * 12 + 9);
    expect(sliderMax('day', today)).toBe(today);
    expect(sliderValue(toDay('1800-05-06'), 'year')).toBe(148);
    expect(sliderValue(toDay('1800-05-06'), 'month')).toBe(148 * 12 + 4);
    expect(sliderValue(toDay('1800-05-06'), 'day')).toBe(toDay('1800-05-06'));
  });

  it('keeps the month and day it can', () => {
    const day = toDay('2020-03-31');

    expect(fromDay(dayFromSlider(148, day, 'year', today))).toBe('1800-03-31');
    expect(fromDay(dayFromSlider(148 * 12 + 1, day, 'month', today))).toBe(
      '1800-02-28'
    );
    expect(dayFromSlider(5, day, 'day', today)).toBe(5);
  });

  it('never passes the ends', () => {
    expect(dayFromSlider(374, today, 'year', today)).toBe(today);
    expect(dayFromSlider(-3, today, 'day', today)).toBe(MIN_DAY);
  });
});

describe('labels', () => {
  it('shows the date at the precision', () => {
    const day = toDay('2026-10-21');

    expect(shownDate(day, 'year')).toBe('2026');
    expect(shownDate(day, 'month')).toBe('2026-10');
    expect(shownDate(day, 'day')).toBe('2026-10-21');
  });

  it('knows today', () => {
    expect(fromDay(todayDay())).toBe(new Date().toISOString().slice(0, 10));
  });
});
