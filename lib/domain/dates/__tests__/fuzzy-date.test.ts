// PIN-04
import { describe, expect, it } from 'vitest';

import type { FuzzyDate } from '@ks/lib/domain/dates/types';

import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import {
  formatFuzzyDate,
  parseFuzzyDate,
} from '@ks/lib/domain/dates/fuzzy-date.mts';

const parsed = (text: string): FuzzyDate => {
  const result = parseFuzzyDate(text);

  if (!result.ok) throw new Error(`${text}: ${result.error}`);

  return result.value;
};

const span = (text: string): [string, string] => {
  const { earliest, latest } = parsed(text);

  return [earliest, latest];
};

describe('parseFuzzyDate qualifiers', () => {
  it.each(['ABT', 'EST', 'CAL'])('%s 1850 is 2 years either side', word => {
    expect(span(`${word} 1850`)).toEqual(['1848-01-01', '1852-12-31']);
    expect(parsed(`${word} 1850`).qualifier).toBe(word);
  });

  it('gives ISO days and day numbers', () => {
    const date = parsed('ABT 1850');

    expect(date.earliestDay).toBe(toDay('1848-01-01'));
    expect(date.latestDay).toBe(toDay('1852-12-31'));
  });

  it('BEF runs from 50 years before to the day before', () => {
    expect(span('BEF 1850')).toEqual(['1800-01-01', '1849-12-31']);
    expect(span('BEF MAR 1850')).toEqual(['1800-03-01', '1850-02-28']);
    expect(span('BEF 1 MAR 1850')).toEqual(['1800-03-01', '1850-02-28']);
  });

  it('AFT runs from the day after to 50 years after', () => {
    expect(span('AFT 1850')).toEqual(['1851-01-01', '1900-12-31']);
    expect(span('AFT FEB 1850')).toEqual(['1850-03-01', '1900-02-28']);
    expect(span('AFT 15 MAR 1850')).toEqual(['1850-03-16', '1900-03-15']);
  });

  it('a month shifted into a leap year ends on its last day', () => {
    expect(span('ABT FEB 1850')).toEqual(['1848-02-01', '1852-02-29']);
    expect(span('AFT FEB 1854')).toEqual(['1854-03-01', '1904-02-29']);
    expect(span('ABT 29 FEB 1904')).toEqual(['1902-02-28', '1906-02-28']);
  });

  it('BET and FROM run from date 1 first day to date 2 last day', () => {
    expect(span('BET 1848 AND 1852')).toEqual(['1848-01-01', '1852-12-31']);
    expect(span('FROM 1840 TO 1855')).toEqual(['1840-01-01', '1855-12-31']);
    expect(parsed('FROM 1840 TO 1855')).toMatchObject({
      date1: '1840',
      date2: '1855',
      qualifier: 'FROM',
    });
  });

  it('an exact date spans its precision', () => {
    expect(parsed('1850')).toMatchObject({
      precision: 'year',
      qualifier: 'EXACT',
    });
    expect(span('1850')).toEqual(['1850-01-01', '1850-12-31']);
    expect(span('FEB 1900')).toEqual(['1900-02-01', '1900-02-28']);
    expect(span('FEB 1904')).toEqual(['1904-02-01', '1904-02-29']);
    expect(span('5 MAR 1850')).toEqual(['1850-03-05', '1850-03-05']);
    expect(parsed('5 MAR 1850')).toMatchObject({
      date1: '1850-03-05',
      precision: 'day',
    });
  });

  it('moves 29 Feb to 28 Feb in a common year', () => {
    expect(span('ABT 29 FEB 1904')).toEqual(['1902-02-28', '1906-02-28']);
    expect(span('AFT 29 FEB 1904')).toEqual(['1904-03-01', '1954-02-28']);
  });

  it('accepts a year before 1652 with negative days', () => {
    const date = parsed('ABT 1600');

    expect(date.earliest).toBe('1598-01-01');
    expect(date.earliestDay).toBeLessThan(0);
    expect(date.latestDay).toBeLessThan(0);
  });

  it('ignores case and extra spaces', () => {
    expect(parsed('  abt   15  mar 1850 ')).toEqual(parsed('ABT 15 MAR 1850'));
  });

  it('takes the coarser precision of a mixed range', () => {
    const date = parsed('BET 1848 AND MAR 1852');

    expect(date).toMatchObject({
      date1: '1848',
      date2: '1852-03',
      precision: 'year',
    });
    expect(span('BET 1848 AND MAR 1852')).toEqual(['1848-01-01', '1852-03-31']);
    expect(parsed('BET 1 JAN 1848 AND MAR 1852').precision).toBe('month');
    expect(parsed('BET 1 JAN 1848 AND 2 JAN 1848').precision).toBe('day');
  });
});

describe('parseFuzzyDate errors', () => {
  it.each([
    ['31 FEB 1850', 'no-such-day'],
    ['29 FEB 1900', 'no-such-day'],
    ['0 JAN 1850', 'no-such-day'],
    ['32 JAN 1850', 'no-such-day'],
    ['999', 'year'],
    ['ABT 3000', 'year'],
    ['BET 1848 AND 3000', 'year'],
    ['BET 999 AND 1850', 'year'],
    ['FROM 31 FEB 1850 TO 1855', 'no-such-day'],
    ['BET 1852 AND 1848', 'reversed'],
    ['FROM 1852 TO 1 JAN 1851', 'reversed'],
    ['', 'syntax'],
    ['hello', 'syntax'],
    ['1850 1851', 'syntax'],
    ['FROM 1840', 'syntax'],
    ['TO 1855', 'syntax'],
    ['BET 1848', 'syntax'],
    ['ABT', 'syntax'],
    ['ABT 1750/51', 'syntax'],
    ['INT 1850 (about)', 'syntax'],
    ['1850 BC', 'syntax'],
    ['@#DJULIAN@ 1850', 'syntax'],
    ['MAR', 'syntax'],
    ['15 1850', 'syntax'],
    ['15 MAR', 'syntax'],
    ['123 MAR 1850', 'syntax'],
    ['ABT ABT 1850', 'syntax'],
  ])('%j is %s', (text, code) => {
    expect(parseFuzzyDate(text)).toEqual({ error: code, ok: false });
  });
});

describe('formatFuzzyDate', () => {
  it('writes the GEDCOM form in capitals', () => {
    expect(formatFuzzyDate(parsed('abt 15 mar 1850'))).toBe('ABT 15 MAR 1850');
    expect(formatFuzzyDate(parsed('5 mar 1850'))).toBe('5 MAR 1850');
    expect(formatFuzzyDate(parsed('1850'))).toBe('1850');
    expect(formatFuzzyDate(parsed('bet 1848 and 1852'))).toBe(
      'BET 1848 AND 1852'
    );
    expect(formatFuzzyDate(parsed('from 1840 to mar 1855'))).toBe(
      'FROM 1840 TO MAR 1855'
    );
  });

  const forms = [
    '1850',
    'MAR 1850',
    '15 MAR 1850',
    '29 FEB 1904',
    '1000',
    '2999',
  ];
  const single = ['ABT', 'AFT', 'BEF', 'CAL', 'EST'].flatMap(q =>
    forms.map(form => `${q} ${form}`)
  );
  const ranges = [
    'BET 1848 AND 1852',
    'BET 1848 AND MAR 1852',
    'BET 5 JAN 1848 AND 20 DEC 1848',
    'FROM 1840 TO 1855',
    'FROM MAR 1840 TO 15 APR 1855',
    'BET 1500 AND 1600',
  ];

  it.each([...forms, ...single, ...ranges])('round-trips %s', text => {
    const date = parsed(text);

    expect(formatFuzzyDate(date)).toBe(text);
    expect(parsed(formatFuzzyDate(date))).toEqual(date);
  });
});
