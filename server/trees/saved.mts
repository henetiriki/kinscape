import { err, ok } from '#ks/lib/domain/result/result.mts';

/** The `Result` of an add: the saved row, or `not-found` for a refused add. */
export const savedOrNotFound = <Entity,>(saved: Entity | undefined) =>
  saved === undefined ? err('not-found') : ok(saved);
