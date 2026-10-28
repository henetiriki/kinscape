import type { BoundaryData } from '@ks/lib/domain/boundaries/types.ts';
import type { Span } from '@ks/lib/domain/map/types';

import { isCurrentOn } from '@ks/lib/domain/boundaries/model.mts';

/** The days that have a Boundary version, as sorted spans that touch or overlap merged. */
export const boundaryCoverage = (data: BoundaryData): Span[] => {
  const spans: Span[] = [];
  const sorted = data.boundaries
    .map(({ validFrom, validTo }) => ({ validFrom, validTo }))
    .sort((a, b) => a.validFrom - b.validFrom);

  for (const span of sorted) {
    const last = spans.at(-1);

    if (!last || (last.validTo !== null && span.validFrom > last.validTo)) {
      spans.push(span);
    } else if (last.validTo !== null) {
      last.validTo =
        span.validTo === null ? null : Math.max(last.validTo, span.validTo);
    }
  }

  return spans;
};

/** Whether a Boundary version is valid on `day`. */
export const hasBorders = (coverage: Span[], day: number): boolean =>
  coverage.some(span => isCurrentOn(span, day));
