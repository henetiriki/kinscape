import type {
  ExpressionSpecification,
  LayerSpecification,
  SourceSpecification,
} from 'maplibre-gl';

/** A MapLibre layer that can name the basemap layer it draws in front of. */
export type DrawingLayer = {
  /** The id of the basemap layer this one is placed ahead of; the end of the stack if absent. */
  before?: string;
} & LayerSpecification;

/** A set of drawing layers the map shows, hides and filters together. */
export type Layer = {
  /** The help text under the layer's row in the Layers panel. */
  description: string;
  /** The filter for each drawing layer id on `day`. */
  filters: (day: number) => Record<string, ExpressionSpecification>;
  id: LayerId;
  /** The name on the layer's row in the Layers panel. */
  label: string;
  layers: DrawingLayer[];
  sources: Record<string, SourceSpecification>;
};

/** A layer's key: in the `visible` record and, with `-help`, in its panel row's DOM ids. */
export type LayerId = string;
