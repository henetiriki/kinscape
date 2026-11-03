import type {
  FuzzyDate,
  FuzzyDateError,
  Qualifier,
} from '#ks/lib/domain/dates/types.ts';
import type { Precision } from '#ks/lib/domain/map/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { fromDay, toDay } from '#ks/lib/domain/boundaries/model.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];
const MIN_YEAR = 1000;
const MAX_YEAR = 2999;
const NEAR_YEARS = 2;
const FAR_YEARS = 50;
const PRECISIONS: Precision[] = ['year', 'month', 'day'];
const SINGLE: Qualifier[] = ['ABT', 'AFT', 'BEF', 'CAL', 'EST'];

const pad = (value: number, width: number): string =>
  String(value).padStart(width, '0');

const daysIn = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const precisionOf = (date: string): Precision =>
  PRECISIONS[date.split('-').length - 1];

const coarser = (a: Precision, b: Precision): Precision =>
  PRECISIONS[Math.min(PRECISIONS.indexOf(a), PRECISIONS.indexOf(b))];

const firstDay = (date: string): string => {
  const [year, month = '01', day = '01'] = date.split('-');

  return `${year}-${month}-${day}`;
};

const lastDay = (date: string): string => {
  const [year, month = '12', day] = date.split('-');

  return `${year}-${month}-${day ?? pad(daysIn(Number(year), Number(month)), 2)}`;
};

/** Moves an ISO day by whole years, keeping month and day; 29 Feb becomes 28 Feb. */
const shiftYears = (iso: string, years: number): string => {
  const [year, month, day] = iso.split('-').map(Number);
  const moved = year + years;

  return `${pad(moved, 4)}-${pad(month, 2)}-${pad(Math.min(day, daysIn(moved, month)), 2)}`;
};

const shiftDays = (iso: string, days: number): string =>
  fromDay(toDay(iso) + days);

const parseDate = (text: string): Result<string, FuzzyDateError> => {
  const match = /^(?:(?:(\d{1,2}) )?([A-Z]{3}) )?(\d{1,4})$/.exec(text);

  if (!match) return err('syntax');
  const [, dayText, monthText, yearText] = match;
  const month = monthText === undefined ? 0 : MONTHS.indexOf(monthText) + 1;

  if (monthText !== undefined && month === 0) return err('syntax');
  const year = Number(yearText);

  if (year < MIN_YEAR || year > MAX_YEAR) return err('year');
  if (month === 0) return ok(yearText);
  if (dayText === undefined) return ok(`${yearText}-${pad(month, 2)}`);
  const day = Number(dayText);

  if (day < 1 || day > daysIn(year, month)) return err('no-such-day');

  return ok(`${yearText}-${pad(month, 2)}-${pad(day, 2)}`);
};

const build = (
  qualifier: Qualifier,
  date1: string,
  date2?: string
): FuzzyDate => {
  const first = firstDay(date1);
  const end = date2 ?? date1;
  const last = lastDay(end);
  // Month and year precision end on the last day of the moved period.
  const lastAfter = (years: number): string =>
    end.split('-').length === 3
      ? shiftYears(last, years)
      : lastDay(`${pad(Number(end.slice(0, 4)) + years, 4)}${end.slice(4)}`);
  const [earliest, latest] = {
    ABT: [shiftYears(first, -NEAR_YEARS), lastAfter(NEAR_YEARS)],
    AFT: [shiftDays(last, 1), lastAfter(FAR_YEARS)],
    BEF: [shiftYears(first, -FAR_YEARS), shiftDays(first, -1)],
    BET: [first, last],
    CAL: [shiftYears(first, -NEAR_YEARS), lastAfter(NEAR_YEARS)],
    EST: [shiftYears(first, -NEAR_YEARS), lastAfter(NEAR_YEARS)],
    EXACT: [first, last],
    FROM: [first, last],
  }[qualifier];

  return {
    date1,
    ...(date2 === undefined ? {} : { date2 }),
    earliest,
    earliestDay: toDay(earliest),
    latest,
    latestDay: toDay(latest),
    precision: coarser(precisionOf(date1), precisionOf(date2 ?? date1)),
    qualifier,
  };
};

const parseRange = (
  qualifier: 'BET' | 'FROM',
  [text1, text2]: string[]
): Result<FuzzyDate, FuzzyDateError> => {
  const date1 = parseDate(text1);

  if (!date1.ok) return date1;
  const date2 = parseDate(text2);

  if (!date2.ok) return date2;
  if (firstDay(date1.value) > lastDay(date2.value)) return err('reversed');

  return ok(build(qualifier, date1.value, date2.value));
};

/** Parses a GEDCOM date: years 1000–2999 only. Never throws. */
export const parseFuzzyDate = (
  text: string
): Result<FuzzyDate, FuzzyDateError> => {
  const clean = text.trim().replace(/\s+/g, ' ').toUpperCase();
  const between = /^BET (.+) AND (.+)$/.exec(clean);

  if (between) return parseRange('BET', between.slice(1));
  const from = /^FROM (.+) TO (.+)$/.exec(clean);

  if (from) return parseRange('FROM', from.slice(1));
  const word = clean.slice(0, 3) as Qualifier;
  const qualified = SINGLE.includes(word) && clean[3] === ' ';
  const date = parseDate(qualified ? clean.slice(4) : clean);

  if (!date.ok) return date;

  return ok(build(qualified ? word : 'EXACT', date.value));
};

const formatDate = (date: string): string => {
  const [year, month, day] = date.split('-');

  return [
    day === undefined ? undefined : String(Number(day)),
    month === undefined ? undefined : MONTHS[Number(month) - 1],
    year,
  ]
    .filter(part => part !== undefined)
    .join(' ');
};

export const formatFuzzyDate = (date: FuzzyDate): string => {
  const first = formatDate(date.date1);

  if (date.date2 !== undefined) {
    const second = formatDate(date.date2);

    return date.qualifier === 'BET'
      ? `BET ${first} AND ${second}`
      : `FROM ${first} TO ${second}`;
  }

  return date.qualifier === 'EXACT' ? first : `${date.qualifier} ${first}`;
};
