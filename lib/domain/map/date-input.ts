import type { Fix, Precision, Problem } from '@ks/lib/domain/map/types';

import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { shownDate } from '@ks/lib/domain/map/map-date';

type Check =
  | { day: number; ok: true; precision: Precision }
  | { ok: false; problem: Problem };

const FORMAT = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (n: number): string => String(n).padStart(2, '0');

const fail = (message: string, fix?: Fix): Check => ({
  ok: false,
  problem: { fix, message },
});

/** The number of days in `month` (1–12) of `year`; `setUTCFullYear` keeps years below 100 as typed. */
const daysIn = (year: number, month: number): number => {
  const end = new Date(0);

  end.setUTCFullYear(year, month, 0);

  return end.getUTCDate();
};

/**
 * What typed `text` means as a Map date: `1901`, `1901-06` or `1901-06-14`
 * (single digits are padded). The day is the first of the period typed.
 * A problem says what is wrong and offers the nearest date that works.
 */
export const checkDate = (text: string, min: number, max: number): Check => {
  const match = FORMAT.exec(text.trim());
  const [, typedYear, typedMonth, typedDate] = match ?? [];
  const month = typedMonth === undefined ? undefined : Number(typedMonth);
  const date = typedDate === undefined ? undefined : Number(typedDate);
  const precision: Precision =
    date === undefined ? (month === undefined ? 'year' : 'month') : 'day';

  if (!match || month === 0 || date === 0 || month! > 12 || date! > 31) {
    return fail('Use 1901, 1901-06 or 1901-06-14.');
  }

  const year = Number(typedYear);
  const last = daysIn(year, month ?? 1);

  if (date !== undefined && date > last) {
    const iso = `${typedYear}-${pad(month!)}-${pad(last)}`;

    return fail(`${MONTHS[month! - 1]} ${year} has ${last} days.`, {
      day: toDay(iso),
      label: `Go to ${iso}`,
      precision: 'day',
    });
  }

  const day = toDay(`${typedYear}-${pad(month ?? 1)}-${pad(date ?? 1)}`);

  if (day < min) {
    return fail('Dates run from 1652 to today.', {
      day: min,
      label: `Go to ${shownDate(min, 'year')}`,
      precision: 'year',
    });
  }

  if (day > max) {
    return fail("That's after today.", {
      day: max,
      label: 'Go to today',
      precision: 'day',
    });
  }

  return { day, ok: true, precision };
};
