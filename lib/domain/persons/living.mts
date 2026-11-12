import type { PersonInput } from '#ks/lib/domain/persons/types.ts';

/** A Person is living unless the Tree records a death date or the deceased mark. */
export const isLiving = ({
  death,
  deceased,
}: Pick<PersonInput, 'death' | 'deceased'>): boolean =>
  death === undefined && !deceased;
