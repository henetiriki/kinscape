import type { PersonSummary } from '#ks/lib/domain/persons/types.ts';

const collator = new Intl.Collator('en', { sensitivity: 'base' });

/** Lower case, no accents, one space between words. */
const plain = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Orders Persons by surname, then given names, ignoring case and accents. */
export const byName = (a: PersonSummary, b: PersonSummary): number =>
  collator.compare(a.surname, b.surname) ||
  collator.compare(a.givenNames, b.givenNames);

/**
 * Whether a Person matches what the user typed, on part of the given names, surname, "given
 * surname", "surname, given", the maiden name or a variant. `undefined` is no match. A `variant`
 * is set when no name matched and that spelling did.
 */
export const matchesQuery = (
  person: PersonSummary,
  query: string
): { variant?: string } | undefined => {
  const wanted = plain(query);
  const { givenNames, maidenName, surname } = person;
  const names = [
    givenNames,
    surname,
    `${givenNames} ${surname}`,
    `${surname}, ${givenNames}`,
    maidenName,
  ];

  if (wanted === '' || names.some(name => plain(name).includes(wanted))) {
    return {};
  }

  const variant = person.variants.find(text => plain(text).includes(wanted));

  return variant === undefined ? undefined : { variant };
};
