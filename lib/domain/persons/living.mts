import type { PersonInput } from '#ks/lib/domain/persons/types.ts';

/** A Person is living unless a death date is recorded or they are marked deceased. */
export const isLiving = ({
  death,
  deceased,
}: Pick<PersonInput, 'death' | 'deceased'>): boolean =>
  death === undefined && !deceased;
