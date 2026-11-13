// PIN-04
import { describe, expect, it } from 'vitest';

import type { FuzzyDateError } from '@ks/lib/domain/dates/types';

import {
  fuzzyDateMessage,
  readFuzzyDate,
} from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';

const reading = (text: string): string => {
  const result = parseFuzzyDate(text);

  if (!result.ok) throw new Error(`${text}: ${result.error}`);

  return readFuzzyDate(result.value);
};

const message = (text: string): string => {
  const result = parseFuzzyDate(text);

  if (result.ok) throw new Error(`${text} parsed`);

  return fuzzyDateMessage(result.error, text);
};

describe('readFuzzyDate', () => {
  it.each([
    ['14 MAR 1850', 'On 14 March 1850'],
    ['1850', 'In 1850'],
    ['MAR 1850', 'In March 1850'],
    ['ABT 1850', 'About 1850'],
    ['BEF 1850', 'Before 1850'],
    ['AFT 1850', 'After 1850'],
    ['BET 1850 AND 1855', 'Between 1850 and 1855'],
    ['FROM 1850 TO 1855', 'From 1850 to 1855'],
    ['EST 1850', 'Estimated as 1850'],
    ['CAL 1850', 'Calculated as 1850'],
    ['ABT 3 JUN 1850', 'About 3 June 1850'],
    ['BET 2 FEB 1850 AND MAR 1855', 'Between 2 February 1850 and March 1855'],
    ['29 FEB 1904', 'On 29 February 1904'],
  ])('%s reads %s', (text, expected) => {
    expect(reading(text)).toBe(expected);
  });
});

describe('fuzzyDateMessage', () => {
  it.each(['14/03/1850', 'ABT', 'FROM 1850', 'TO 1855', 'BET 1850'])(
    '%s gets the syntax message',
    text => {
      expect(message(text)).toBe(
        'Use a date like 1850, 14 MAR 1850, ABT 1850 or BET 1850 AND 1855.'
      );
    }
  );

  it('asks for a year from 1000 to 2999', () => {
    expect(message('ABT 850')).toBe('Use a year from 1000 to 2999.');
  });

  it.each([
    ['31 FEB 1850', 'February 1850 has 28 days.'],
    ['29 FEB 1900', 'February 1900 has 28 days.'],
    ['31 APR 1850', 'April 1850 has 30 days.'],
    ['ABT 30 FEB 1904', 'February 1904 has 29 days.'],
    ['BET 1850 AND 31 SEP 1855', 'September 1855 has 30 days.'],
    ['  bet  31 jun 1850  and 1855 ', 'June 1850 has 30 days.'],
  ])('%s names the days of its month', (text, expected) => {
    expect(message(text)).toBe(expected);
  });

  it.each([
    ['BET 1855 AND 1850', 'Put the earlier date first: BET 1850 AND 1855.'],
    [
      'FROM 3 MAR 1855 TO 1850',
      'Put the earlier date first: FROM 1850 TO 3 MAR 1855.',
    ],
  ])('%s swaps the two dates', (text, expected) => {
    expect(message(text)).toBe(expected);
  });

  it('falls back to the syntax message when the text no longer matches the error', () => {
    const kinds: FuzzyDateError[] = ['no-such-day', 'reversed'];

    for (const kind of kinds) {
      expect(fuzzyDateMessage(kind, '1850')).toBe(
        'Use a date like 1850, 14 MAR 1850, ABT 1850 or BET 1850 AND 1855.'
      );
    }
  });
});
