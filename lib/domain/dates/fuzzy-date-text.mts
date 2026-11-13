import type {
  FuzzyDate,
  FuzzyDateError,
  Qualifier,
} from '#ks/lib/domain/dates/types.ts';

import {
  daysIn,
  formatFuzzyDate,
  fuzzyDateOf,
  parseDate,
  splitFuzzyDate,
} from '#ks/lib/domain/dates/fuzzy-date.mts';
import { MONTH_NAMES } from '#ks/lib/domain/dates/months.mts';

const SYNTAX =
  'Use a date like 1850, 14 MAR 1850, ABT 1850 or BET 1850 AND 1855.';

/** Words that join the reading of a single date: `About 1850`. */
const BEFORE: Record<Exclude<Qualifier, 'BET' | 'EXACT' | 'FROM'>, string> = {
  ABT: 'About',
  AFT: 'After',
  BEF: 'Before',
  CAL: 'Calculated as',
  EST: 'Estimated as',
};

/** `1850-03-14` as `14 March 1850`. */
const spoken = (date: string): string => {
  const [year, month, day] = date.split('-');

  return [
    day === undefined ? undefined : String(Number(day)),
    month === undefined ? undefined : MONTH_NAMES[Number(month) - 1],
    year,
  ]
    .filter(part => part !== undefined)
    .join(' ');
};

/** A plain reading of a parsed date, such as `Between 1850 and 1855`. */
export const readFuzzyDate = (date: FuzzyDate): string => {
  const first = spoken(date.date1);

  if (date.qualifier === 'BET')
    return `Between ${first} and ${spoken(date.date2!)}`;
  if (date.qualifier === 'FROM')
    return `From ${first} to ${spoken(date.date2!)}`;
  if (date.qualifier === 'EXACT')
    return `${date.date1.split('-').length === 3 ? 'On' : 'In'} ${first}`;

  return `${BEFORE[date.qualifier]} ${first}`;
};

const SHORT_BEFORE: Partial<Record<Qualifier, string>> = {
  ABT: 'c. ',
  AFT: 'aft. ',
  BEF: 'bef. ',
  CAL: 'c. ',
  EST: 'c. ',
};

/**
 * A reading of years for a list cell: `1850`, `c. 1850`, `bef. 1840` or `1880–1885`.
 * A range inside one year reads as that year.
 */
export const shortFuzzyDate = (date: FuzzyDate): string => {
  const year = (text: string) => text.slice(0, 4);

  if (date.date2 === undefined) {
    return `${SHORT_BEFORE[date.qualifier] ?? ''}${year(date.date1)}`;
  }

  return year(date.date1) === year(date.date2)
    ? year(date.date1)
    : `${year(date.date1)}–${year(date.date2)}`;
};

const noSuchDay = (texts: string[]): null | string => {
  for (const text of texts) {
    const parsed = parseDate(text);

    if (!parsed.ok && parsed.error === 'no-such-day') {
      const [, day, month, year] = /^(\d{1,2}) ([A-Z]{3}) (\d{1,4})$/.exec(
        text
      )!;

      // Day 0 is in no month, so no month length says what to change.
      if (Number(day) < 1) return null;

      const index = MONTH_NAMES.findIndex(
        name => name.slice(0, 3).toUpperCase() === month
      );

      return `${MONTH_NAMES[index]} ${Number(year)} has ${daysIn(Number(year), index + 1)} days.`;
    }
  }

  return null;
};

const reversed = (text: string): null | string => {
  const { qualifier, texts } = splitFuzzyDate(text);
  const [date1, date2] = texts.map(part => parseDate(part));

  if (texts.length !== 2 || !date1.ok || !date2.ok) return null;

  return `Put the earlier date first: ${formatFuzzyDate(fuzzyDateOf(qualifier, date2.value, date1.value))}.`;
};

/**
 * The message for an error of `parseFuzzyDate`. `no-such-day` and `reversed` read `text` again,
 * because the error kind does not say which month or dates the text names.
 */
export const fuzzyDateMessage = (
  error: FuzzyDateError,
  text: string
): string => {
  if (error === 'year') return 'Use a year from 1000 to 2999.';
  if (error === 'no-such-day')
    return noSuchDay(splitFuzzyDate(text).texts) ?? SYNTAX;
  if (error === 'reversed') return reversed(text) ?? SYNTAX;

  return SYNTAX;
};
