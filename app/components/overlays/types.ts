import type { IconName } from '@ks/app/components/foundation/types';
import type { EventType } from '@ks/lib/ui/types';

/** One level of the Jurisdiction chain; `detail` says what the name was before. */
export type ChainLevel = { detail?: string; level: string; name: string };

export type MenuEntry = {
  detail?: string;
  /** Stays in the arrow-key order but does nothing. */
  disabled?: boolean;
  icon: IconName;
  id: string;
  label: string;
};

export type PopupPin = {
  date: string;
  event: EventType;
  /** The pin's record; a pin without one is plain text. */
  href?: string;
  id: string;
  people: string;
  title: string;
};
