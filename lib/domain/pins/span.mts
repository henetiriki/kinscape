import type { Day } from '#ks/lib/domain/boundaries/types.ts';
import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';
import type { Validity } from '#ks/lib/domain/validity/types.ts';

/**
 * The days a Pin shows (PIN-04): its date, clipped by the earliest day of the Person's birth and the
 * latest day of the death. A missing birth or death clips nothing. A Pin that ends before it starts
 * gets an empty span, so `isCurrentOn` is false on each day.
 */
export const spanOf = (
  date: FuzzyDate,
  { birth, death }: { birth?: FuzzyDate; death?: FuzzyDate }
): Validity => {
  const validFrom = Math.max(date.validFrom, birth?.validFrom ?? -Infinity);
  // `fuzzyDateOf` always sets an end day.
  const validTo = Math.min(date.validTo!, death?.validTo ?? Infinity);

  return {
    validFrom: validFrom as Day,
    validTo: Math.max(validFrom, validTo) as Day,
  };
};
