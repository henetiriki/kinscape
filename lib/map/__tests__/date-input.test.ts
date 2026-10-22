import { expect, it } from 'vitest';

import { toDay } from '../../boundaries/model.mts';
import { checkDate } from '../date-input';
import { MIN_DAY } from '../map-date';

const TODAY = toDay('2026-10-21');
const check = (text: string) => checkDate(text, MIN_DAY, TODAY);

const problem = (text: string) => {
  const result = check(text);

  if (result.ok) throw new Error(`${text} should not be accepted`);

  return result.problem;
};

// MAP-03
it('accepts a year, a month and a day, at that precision', () => {
  expect(check('1901')).toEqual({
    day: toDay('1901-01-01'),
    ok: true,
    precision: 'year',
  });
  expect(check('1901-06')).toEqual({
    day: toDay('1901-06-01'),
    ok: true,
    precision: 'month',
  });
  expect(check('1901-06-14')).toEqual({
    day: toDay('1901-06-14'),
    ok: true,
    precision: 'day',
  });
});

it('pads single digits and ignores surrounding spaces', () => {
  expect(check(' 1901-6-4 ')).toEqual({
    day: toDay('1901-06-04'),
    ok: true,
    precision: 'day',
  });
  expect(check('1901-6')).toMatchObject({ ok: true, precision: 'month' });
});

it('accepts the first Map date and today', () => {
  expect(check('1652-01-01')).toMatchObject({ day: MIN_DAY, ok: true });
  expect(check('2026-10-21')).toMatchObject({ day: TODAY, ok: true });
  expect(check('2026')).toMatchObject({ ok: true, precision: 'year' });
});

it('names the formats it accepts when the format is wrong', () => {
  for (const text of [
    '14/06/1901',
    '',
    '190',
    '1901-',
    '1901-00',
    '1901-13',
    '1901-06-00',
    '1901-06-32',
    'June 1901',
  ]) {
    expect(problem(text)).toEqual({
      fix: undefined,
      message: 'Use 1901, 1901-06 or 1901-06-14.',
    });
  }
});

it('says how many days a month has and offers its last day', () => {
  expect(problem('1901-02-30')).toEqual({
    fix: {
      day: toDay('1901-02-28'),
      label: 'Go to 1901-02-28',
      precision: 'day',
    },
    message: 'February 1901 has 28 days.',
  });
  expect(problem('1904-02-30').message).toBe('February 1904 has 29 days.');
  expect(problem('1901-04-31')).toMatchObject({
    fix: { label: 'Go to 1901-04-30' },
    message: 'April 1901 has 30 days.',
  });
  expect(problem('0050-02-30').message).toBe('February 50 has 28 days.');
});

it('offers 1652 for a date before it', () => {
  expect(problem('1650')).toEqual({
    fix: { day: MIN_DAY, label: 'Go to 1652', precision: 'year' },
    message: 'Dates run from 1652 to today.',
  });
  expect(problem('1651-12-31').fix?.day).toBe(MIN_DAY);
});

it('offers today for a date after it', () => {
  expect(problem('2031')).toEqual({
    fix: { day: TODAY, label: 'Go to today', precision: 'day' },
    message: "That's after today.",
  });
  expect(problem('2026-11')).toMatchObject({ message: "That's after today." });
  expect(problem('2026-10-22')).toMatchObject({
    message: "That's after today.",
  });
});
