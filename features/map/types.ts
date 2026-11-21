import type {
  ExpressionSpecification,
  LayerSpecification,
  SourceSpecification,
} from 'maplibre-gl';
import type { ReactNode } from 'react';

import type { Day } from '@ks/lib/domain/boundaries/types.ts';
import type { EventType } from '@ks/lib/ui/types';

/** A MapLibre layer that can name the basemap layer it draws in front of. */
export type DrawingLayer = {
  /** The id of the basemap layer this one is placed ahead of; the end of the stack if absent. */
  before?: string;
} & LayerSpecification;

/** A Pin of a fan: its id, its Event type and the reading of its date, such as "From 1890 to 1905". */
export type FanPin = { event: EventType; id: string; reading: string };

/** The image data MapLibre takes for `addImage`. */
export type IconImage = {
  data: Uint8ClampedArray;
  height: number;
  width: number;
};

/** A set of drawing layers the map shows, hides and filters together. */
export type Layer = {
  /** The help text under the layer's row in the Layers panel; a function gives it for the Map date. */
  description: ((day: Day) => string) | string;
  /** The filter for each drawing layer id on `day`. `open` is the id of the Pin whose popup is open. */
  filters: (day: Day, open?: string) => Record<string, ExpressionSpecification>;
  /**
   * The icons the layer's symbols use: an image id mapped to a 24 × 24 path. The map draws each
   * as an SDF image when the style asks for it.
   */
  icons?: Record<string, string>;
  id: LayerId;
  /** The name on the layer's row in the Layers panel. */
  label: string;
  layers: DrawingLayer[];
  /**
   * The HTML markers the layer places on the map on `day`, such as the count marker of a shared
   * Place. `open` is the id of the open Pin; `onOpen` opens a Pin, as a click on a feature does.
   */
  markers?: (
    day: Day,
    open: string | undefined,
    onOpen: (id: string) => void
  ) => MapMarker[];
  /** The ids of the drawing layers a click can pick. The `id` property of the picked feature is what a click reports. */
  select?: string[];
  sources: Record<string, SourceSpecification>;
};

/** A layer's key: in the `visible` record and, with `-help`, in its panel row's DOM ids. */
export type LayerId = string;

/** What `MapShell` calls to drive the map from the zoom card. */
export type MapHandle = {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

/** An HTML marker at a map point: a key that stays the same from day to day, the point as longitude and latitude, and what it draws. */
export type MapMarker = {
  key: string;
  node: ReactNode;
  position: [number, number];
};

/** The Pin whose popup is open: its id and its position, as longitude and latitude. */
export type OpenPin = { id: string; position: [number, number] };

/** Whether the map zoom is at its minimum or maximum. */
export type ZoomLimits = { atMax: boolean; atMin: boolean };
