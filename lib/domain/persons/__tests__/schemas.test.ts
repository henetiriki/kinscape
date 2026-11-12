import { describe, expect, it } from 'vitest';

import { personInputSchema } from '@ks/lib/domain/persons/schemas.mts';

const ID = '01900000-0000-7000-8000-0000000000a1';

// PPL-01
describe('personInputSchema', () => {
  it('fills the defaults: unknown sex, no names, not deceased', () => {
    expect(personInputSchema.parse({ id: ID })).toEqual({
      deceased: false,
      givenNames: '',
      id: ID,
      maidenName: '',
      notes: '',
      sex: 'U',
      surname: '',
      variants: [],
    });
  });

  it('parses a GEDCOM date and trims text', () => {
    const person = personInputSchema.parse({
      birth: 'ABT 1850',
      givenNames: '  Ana  ',
      id: ID,
      variants: [' Anna '],
    });

    expect(person.birth?.qualifier).toBe('ABT');
    expect(person.birth?.date1).toBe('1850');
    expect(person.givenNames).toBe('Ana');
    expect(person.variants).toEqual(['Anna']);
  });

  it('treats a blank date as none', () => {
    expect(personInputSchema.parse({ death: '  ', id: ID }).death).toBe(
      undefined
    );
  });

  it.each([
    ['an id that is not a UUID', { id: 'nope' }],
    ['a bad date', { birth: 'SOMETIME', id: ID }],
    ['an unknown sex', { id: ID, sex: 'Q' }],
    ['a long name', { id: ID, surname: 'x'.repeat(201) }],
    ['21 variants', { id: ID, variants: Array(21).fill('x') }],
    ['long notes', { id: ID, notes: 'x'.repeat(10_001) }],
    ['a NUL in a name', { id: ID, surname: 'a\0b' }],
    ['a NUL in the notes', { id: ID, notes: 'a\0b' }],
    ['a NUL in a variant', { id: ID, variants: ['a\0b'] }],
  ])('refuses %s', (_what, input) => {
    expect(personInputSchema.safeParse(input).success).toBe(false);
  });

  it('accepts the limits', () => {
    expect(
      personInputSchema.safeParse({
        givenNames: 'x'.repeat(200),
        id: ID,
        notes: 'x'.repeat(10_000),
        variants: Array(20).fill('x'),
      }).success
    ).toBe(true);
  });
});
