import { describe, expect, it } from 'vitest';

import { fuzzyDateOf } from '@ks/lib/domain/dates/fuzzy-date.mts';
import {
  personDates,
  personSummary,
  spouseDates,
} from '@ks/lib/domain/persons/dates.mts';

// PPL-01
describe('personDates', () => {
  it('gives the short text and the reading of each date', () => {
    expect(
      personDates({
        birth: fuzzyDateOf('ABT', '1856'),
        death: fuzzyDateOf('EXACT', '1930'),
        deceased: true,
      })
    ).toEqual({
      born: 'c. 1856',
      bornReading: 'About 1856',
      deceased: true,
      died: '1930',
      diedReading: 'In 1930',
    });
  });

  it('gives empty texts for a date that is not known', () => {
    expect(personDates({ deceased: false })).toEqual({
      born: '',
      bornReading: '',
      deceased: false,
      died: '',
      diedReading: '',
    });
  });
});

// PPL-01
describe('personSummary', () => {
  it('gives the row of the People list and leaves the notes out', () => {
    const view = {
      birth: fuzzyDateOf('EXACT', '1900'),
      deceased: false,
      givenNames: 'Anna',
      id: 'p1',
      maidenName: 'Nel',
      notes: 'private',
      surname: 'Botha',
      variants: ['Bota'],
    };

    expect(personSummary(view)).toEqual({
      born: '1900',
      bornReading: 'In 1900',
      deceased: false,
      died: '',
      diedReading: '',
      givenNames: 'Anna',
      id: 'p1',
      maidenName: 'Nel',
      surname: 'Botha',
      variants: ['Bota'],
    });
  });
});

// PPL-02
describe('spouseDates', () => {
  it('gives the short text and the reading of each date', () => {
    expect(
      spouseDates({
        divorce: fuzzyDateOf('EXACT', '1890'),
        marriage: fuzzyDateOf('ABT', '1875'),
      })
    ).toEqual({
      divorced: '1890',
      divorcedReading: 'In 1890',
      married: 'c. 1875',
      marriedReading: 'About 1875',
    });
  });

  it('gives empty texts for a date that is not known', () => {
    expect(spouseDates({})).toEqual({
      divorced: '',
      divorcedReading: '',
      married: '',
      marriedReading: '',
    });
  });
});
