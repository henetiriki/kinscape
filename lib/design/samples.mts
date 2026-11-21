/** Synthetic samples: the component cards draw them. */

import type { ContestedYears, Epoch } from '#ks/lib/ui/types.ts';

import { toDay } from '#ks/lib/domain/boundaries/model.mts';
import { EVENT_TYPES } from '#ks/lib/domain/pins/schemas.mts';

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

/** The line under an empty or unreadable fuzzy date field, on its component card. */
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

/** The Pin of the `PinPopup` cards and the Pin popup boards: a residence at Example Farm. */
export const PIN_POPUP = {
  event: 'residence' as const,
  reading: 'From 1890 to 1905',
  recorded: 'FROM 1890 TO 1905',
};

/** What the details add to a loaded `PinPopup`. */
export const PIN_DETAILS = {
  address: 'Farm Example, district Example',
  name: 'Example Person',
};

/** The tabs of a `Panel` card state: Layers and Filters, with one active filter. `body` is the id of the state's tabpanel. */
export const panelTabs = (body: string) => [
  { controls: body, label: 'Layers', value: 'layers' },
  { controls: body, count: 1, label: 'Filters', value: 'filters' },
];

/** The layer groups of the `Map` board, with its default rows on. A row has no `onChange`: the card names it in `handlers`. */
export const LAYER_GROUPS = [
  {
    heading: 'Boundaries',
    rows: [
      {
        checked: true,
        description: 'Colonies, republics, provinces, homelands',
        id: 'polities',
        label: 'Polities',
      },
      {
        checked: false,
        description: 'Drostdy and magisterial districts',
        id: 'districts',
        label: 'Districts',
      },
    ],
  },
  {
    heading: 'Basemap',
    rows: [
      {
        checked: true,
        description: 'As they were on the map date',
        id: 'names',
        label: 'Place names',
        size: 'm' as const,
      },
      {
        checked: true,
        description: 'Many early borders follow them',
        id: 'rivers',
        label: 'Rivers',
        size: 'm' as const,
      },
      {
        checked: true,
        description: 'Hillshade, no modern borders',
        id: 'terrain',
        label: 'Terrain',
        size: 'm' as const,
      },
    ],
  },
  {
    heading: 'Pins',
    rows: [
      {
        checked: true,
        description: '8 of 214 true on this date',
        id: 'pins',
        label: 'Pins',
        size: 'm' as const,
      },
      {
        checked: true,
        description: 'Grow with the date range',
        id: 'halos',
        label: 'Uncertainty halos',
        size: 'm' as const,
      },
    ],
  },
];

/** The Filters tab choices of the `Map` board. */
export const FILTER_BRANCHES = [
  { label: 'Everyone', value: '' },
  { label: 'Ancestors of…', value: 'ancestors' },
  { label: 'Descendants of…', value: 'descendants' },
];
export const FILTER_EVENT_TYPES = EVENT_TYPES.map(value => ({
  glyph: value,
  label: `${value[0].toUpperCase()}${value.slice(1)}`,
  value,
}));
export const FILTER_PEOPLE = [{ label: 'Anyone', value: '' }];
/** A Person for the `with values` state. The synthetic name is from `FilterFields.test.tsx`. */
export const FILTER_PEOPLE_WITH_ONE = [
  ...FILTER_PEOPLE,
  { label: 'J. Rossouw', value: 'p1' },
];
/** The sample text under Surname on the `Map` board. Spec #1058 D2 decides what Surname matches. */
export const SURNAME_HELPER = 'Matches spelling variants too (Rossouw, Rossau)';

export const PINS = [
  {
    date: '1901-03-14',
    event: 'marriage' as const,
    id: 'marriage',
    people: 'J. Rossouw & M. du Toit',
    title: 'Marriage',
  },
];
