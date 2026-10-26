import type { ControlState } from '@/app/components/foundation/types';
import type { EventType } from '@/app/components/map/types';

export type ChipOption = {
  /** The Event type this chip filters on; its glyph leads the label. */
  glyph?: EventType;
  label: string;
  value: string;
};

export type Segment = { label: string; state?: ControlState; value: string };

export type Tab = {
  /** The id of the tabpanel this tab shows; the panel belongs to the screen. */
  controls?: string;
  /** How many choices are active in the panel; shown as a badge when above 0. */
  count?: number;
  label: string;
  state?: ControlState;
  value: string;
};
