import type { ControlState } from '@ks/app/components/foundation/types';
import type { EventType } from '@ks/lib/ui/types';

export type ChipOption = {
  /** The Event type this chip filters on; its glyph leads the label. */
  glyph?: EventType;
  label: string;
  value: string;
};

/** The dates of a Person, as the page sends them. An empty text is an unknown date. */
export type PersonDates = {
  /** Short text of the birth date, such as "bef. 1840". */
  born: string;
  /** Full reading of the birth date, such as "Before 1840". */
  bornReading: string;
  /** Marked deceased. */
  deceased?: boolean;
  died: string;
  diedReading: string;
};

export type Segment = { label: string; state?: ControlState; value: string };

/** The marriage and divorce dates of a spouse link, in the same two forms. */
export type SpouseDates = {
  divorced?: string;
  divorcedReading?: string;
  married?: string;
  marriedReading?: string;
};

export type Tab = {
  /** The id of the tabpanel this tab shows; the panel belongs to the screen. */
  controls?: string;
  /** How many choices are active in the panel; shown as a badge when above 0. */
  count?: number;
  label: string;
  state?: ControlState;
  value: string;
};
