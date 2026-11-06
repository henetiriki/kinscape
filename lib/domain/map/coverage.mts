import type { BoundaryData, Day } from '#ks/lib/domain/boundaries/types.ts';
import type { Validity } from '#ks/lib/domain/validity/types.ts';

import { asDay } from '#ks/lib/domain/boundaries/model.mts';
import { current } from '#ks/lib/domain/validity/validity.mts';

/** The days that have a Boundary version, as sorted spans that touch or overlap merged. */
export const boundaryCoverage = (data: BoundaryData): Validity[] => {
  const spans: Validity[] = [];
  const sorted = data.boundaries
    .map(({ validFrom, validTo }) => ({ validFrom, validTo }))
    .sort((a, b) => a.validFrom - b.validFrom);

  for (const span of sorted) {
    const last = spans.at(-1);

    if (!last || (last.validTo !== null && span.validFrom > last.validTo)) {
      spans.push(span);
    } else if (last.validTo !== null) {
      last.validTo =
        span.validTo === null
          ? null
          : asDay(Math.max(last.validTo, span.validTo));
    }
  }

  return spans;
};

/** Whether a Boundary version is valid on `day`. */
export const hasBorders = (coverage: Validity[], day: Day): boolean =>
  current(coverage, day).length > 0;
