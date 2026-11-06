import type { Day } from '#ks/lib/domain/boundaries/types.ts';
import type { Validity } from '#ks/lib/domain/validity/types.ts';

const endOf = ({ validTo }: Validity): number => validTo ?? Infinity;

/** Whether `day` is in `[validFrom, validTo)`. */
export const isCurrentOn = (validity: Validity, day: Day): boolean =>
  validity.validFrom <= day && day < endOf(validity);

/** The rows whose validity holds `day`. */
export const current = <T extends Validity>(
  rows: readonly T[],
  day: Day
): T[] => rows.filter(row => isCurrentOn(row, day));

/** Whether two validities share a day. */
export const overlaps = (a: Validity, b: Validity): boolean =>
  a.validFrom < endOf(b) && b.validFrom < endOf(a);
