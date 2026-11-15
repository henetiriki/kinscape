import { describe, expect, it } from 'vitest';

import {
  dateLine,
  dateWords,
  spouseLine,
  spouseWords,
} from '@ks/app/components/actions/dates';

const none = { born: '', bornReading: '', died: '', diedReading: '' };
const b1889 = { born: '1889', bornReading: 'In 1889' };
const d1932 = { died: '1932', diedReading: 'In 1932' };

// PPL-01
describe('the line and its words', () => {
  it.each([
    [{ ...none, ...b1889 }, '1889 –', 'Born in 1889'],
    [none, '? –', 'Born unknown'],
    [
      { ...none, ...b1889, deceased: true },
      '1889 – ?',
      'Born in 1889, died unknown',
    ],
    [{ ...none, deceased: true }, '? – ?', 'Born unknown, died unknown'],
    [{ ...none, ...d1932 }, '? – 1932', 'Born unknown, died in 1932'],
    [
      { ...none, ...b1889, ...d1932 },
      '1889 – 1932',
      'Born in 1889, died in 1932',
    ],
  ])('%j reads %s and %s', (dates, line, words) => {
    expect(dateLine(dates)).toBe(line);
    expect(dateWords(dates)).toBe(words);
  });

  it('shows a Fuzzy date as short text and reads its full reading', () => {
    const dates = {
      ...none,
      born: 'bef. 1840',
      bornReading: 'Before 1840',
      deceased: true,
    };

    expect(dateLine(dates)).toBe('bef. 1840 – ?');
    expect(dateWords(dates)).toBe('Born before 1840, died unknown');
  });
});

// PPL-01
describe('the spouse dates', () => {
  const both = {
    divorced: '1890',
    divorcedReading: 'In 1890',
    married: '1875',
    marriedReading: 'In 1875',
  };

  it('shows both dates, one date, or no text', () => {
    expect(spouseLine(both)).toBe('Mar. 1875, div. 1890');
    expect(spouseLine({ married: '1875', marriedReading: 'In 1875' })).toBe(
      'Mar. 1875'
    );
    expect(spouseLine({ divorced: '1890', divorcedReading: 'In 1890' })).toBe(
      'Div. 1890'
    );
    expect(spouseLine({})).toBe('');
    expect(spouseWords({})).toBe('');
  });

  it('shows a Fuzzy date as short text and reads its full reading', () => {
    const dates = { married: 'c. 1875', marriedReading: 'About 1875' };

    expect(spouseLine(dates)).toBe('Mar. c. 1875');
    expect(spouseWords(dates)).toBe('Married about 1875');
    expect(spouseWords(both)).toBe('Married in 1875, divorced in 1890');
    expect(spouseWords({ divorced: '1890', divorcedReading: 'In 1890' })).toBe(
      'Divorced in 1890'
    );
  });
});
