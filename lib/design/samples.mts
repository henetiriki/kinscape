/** Synthetic samples: the design kit's boards and the design system's cards both draw them. */

import type { ContestedYears, Epoch } from '#ks/lib/ui/types.ts';

import { toDay } from '#ks/lib/domain/boundaries/model.mts';

export const CHAIN = [
  { level: 'District', name: 'Kimberley' },
  {
    detail: 'Was Griqualand West until 1880',
    level: 'Colony',
    name: 'Cape Colony',
  },
];

/** Seven lines, so the box of a long text field's long content state scrolls. */
export const LONG_NOTES = Array.from(
  { length: 7 },
  (_, line) => `Line ${line + 1} of the notes.`
).join('\n');

/** The line under an empty or unreadable fuzzy date field, in the kit and on its card. */
export const FUZZY_DATE_HELPER =
  'For example 1850, ABT 1850 or BET 1850 AND 1855.';

/** The Map date of the `Map` board, and the last day a Map date can take. */
export const MAP_DATE = toDay('1901-06-14');
export const TODAY = toDay('2026-10-21');

/** The Jump to list of the `Map` board. */
export const EPOCHS: Epoch[] = [
  ...[1652, 1806, 1854, 1880, 1902, 1910, 1976, 1994].map(year => ({ year })),
  { label: 'Today', year: 2026 },
];

/** The `DateDock` samples: the contested note and the hatch of the `Map` board slider. */
export const CONTESTED_COUNT = 2;
export const CONTESTED_YEARS: ContestedYears[] = [{ from: 1900, to: 1901 }];

export const PINS = [
  {
    date: '1901-03-14',
    event: 'marriage' as const,
    id: 'marriage',
    people: 'J. Rossouw & M. du Toit',
    title: 'Marriage',
  },
];
