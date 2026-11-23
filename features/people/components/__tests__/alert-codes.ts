import type { AlertCode } from '@ks/features/people/components/types.ts';

/** Typecheck fails when an `AlertCode` has no key here. */
const CODES: Record<AlertCode, true> = {
  conflict: true,
  cycle: true,
  'divorce-before-marriage': true,
  duplicate: true,
  'not-found': true,
  self: true,
  'third-biological-parent': true,
  'tree-full': true,
};

/** Every code that shows an alert. */
export const ALERT_CODES = Object.keys(CODES) as AlertCode[];
