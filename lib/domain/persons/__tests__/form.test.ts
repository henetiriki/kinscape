import { describe, expect, it } from 'vitest';

import {
  checkPerson,
  personFieldMessages,
} from '@ks/lib/domain/persons/form.mts';

const ID = '01900000-0000-7000-8000-0000000000a1';
const valid = { givenNames: 'Ana', id: ID, surname: 'Smit' };

// PPL-01
describe('checkPerson', () => {
  it('returns the parsed input for a valid form', () => {
    const result = checkPerson({ ...valid, birth: 'ABT 1850' });

    expect(result.ok && result.value.birth?.qualifier).toBe('ABT');
    expect(result.ok && result.value.surname).toBe('Smit');
  });

  it.each([
    ['blank given names', { ...valid, givenNames: '  ' }, 'givenNames'],
    ['missing given names', { id: ID, surname: 'Smit' }, 'givenNames'],
    ['blank surname', { ...valid, surname: '' }, 'surname'],
    ['missing surname', { givenNames: 'Ana', id: ID }, 'surname'],
  ])('gives required for %s', (_what, input, field) => {
    expect(checkPerson(input)).toEqual({
      error: { fields: { [field]: 'required' } },
      ok: false,
    });
  });

  it('gives too-many for 21 spelling variants', () => {
    expect(checkPerson({ ...valid, variants: Array(21).fill('x') })).toEqual({
      error: { fields: { variants: 'too-many' } },
      ok: false,
    });
  });

  it.each([
    ['31 FEB 1850', 'no-such-day'],
    ['BET 1860 AND 1850', 'reversed'],
    ['SOMETIME', 'syntax'],
    ['ABT 999', 'year'],
  ])('gives the date error for a birth of %s', (birth, kind) => {
    expect(checkPerson({ ...valid, birth })).toEqual({
      error: { fields: { birth: kind } },
      ok: false,
    });
  });

  it('gives the date error for a death', () => {
    expect(checkPerson({ ...valid, death: '31 FEB 1850' })).toEqual({
      error: { fields: { death: 'no-such-day' } },
      ok: false,
    });
  });

  it('gives every field error at once', () => {
    expect(
      checkPerson({
        birth: '31 FEB 1850',
        givenNames: '',
        id: ID,
        surname: '',
        variants: Array(21).fill('x'),
      })
    ).toEqual({
      error: {
        fields: {
          birth: 'no-such-day',
          givenNames: 'required',
          surname: 'required',
          variants: 'too-many',
        },
      },
      ok: false,
    });
  });

  // D1: an input that the form already stops gives invalid for the whole input.
  it.each([
    ['a bad id', { ...valid, id: 'nope' }],
    ['an unknown sex', { ...valid, sex: 'Q' }],
    ['a long name', { ...valid, surname: 'x'.repeat(201) }],
    ['a long variant', { ...valid, variants: ['x'.repeat(201)] }],
    ['long notes', { ...valid, notes: 'x'.repeat(10_001) }],
    ['a NUL in a name', { ...valid, surname: 'a\0b' }],
    ['no object', 'Ana'],
    ['a bad id with a field error', { ...valid, givenNames: '', id: 'nope' }],
  ])('gives invalid for %s', (_what, input) => {
    expect(checkPerson(input)).toEqual({ error: 'invalid', ok: false });
  });
});

// PPL-01
describe('personFieldMessages', () => {
  it('words each kind of field error', () => {
    expect(
      personFieldMessages(
        {
          birth: 'no-such-day',
          death: 'syntax',
          givenNames: 'required',
          surname: 'required',
          variants: 'too-many',
        },
        { birth: '31 FEB 1850', death: 'SOMETIME' }
      )
    ).toEqual({
      birth: 'February 1850 has 28 days.',
      death:
        'Use a date like 1850, 14 MAR 1850, ABT 1850 or BET 1850 AND 1855.',
      givenNames: 'Enter the given names.',
      surname: 'Enter the surname.',
      variants: 'Use at most 20 spellings.',
    });
  });

  it('words only the fields that failed', () => {
    expect(
      personFieldMessages({ surname: 'required' }, { birth: '', death: '' })
    ).toEqual({ surname: 'Enter the surname.' });
  });
});
