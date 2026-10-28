import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

import type { Layer } from '@ks/features/map/types';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

// Every colour and width comes from the `map` section of design/tokens.json.
const { map } = resolveTokens(rawTokens);

const BASEMAP: LayerSpecification[] = [
  {
    id: 'background',
    paint: { 'background-color': map.sea },
    type: 'background',
  },
  {
    id: 'land',
    paint: { 'fill-color': map.land },
    source: 'land',
    type: 'fill',
  },
  {
    id: 'rivers',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': map.river.colour,
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        map.river['zoom-min'],
        map.river['width-min'],
        map.river['zoom-max'],
        map.river['width-max'],
      ],
    },
    source: 'rivers',
    type: 'line',
  },
  {
    id: 'coastline',
    paint: {
      'line-color': map.coastline.colour,
      'line-width': map.coastline.width,
    },
    source: 'coastline',
    type: 'line',
  },
];

/** The map's style: the basemap and each layer's drawing layers, filtered to `day`. */
export const buildStyle = (
  day: number,
  layers: Layer[],
  visible = true
): StyleSpecification => {
  const stack = [...BASEMAP];

  for (const { filters, layers: drawing } of layers) {
    const filter = filters(day);

    for (const { before, ...layer } of drawing) {
      const placed = {
        ...layer,
        filter: filter[layer.id],
        layout: {
          ...layer.layout,
          visibility: visible ? 'visible' : 'none',
        },
      } as LayerSpecification;
      const at =
        before === undefined ? -1 : stack.findIndex(l => l.id === before);

      if (at === -1) stack.push(placed);
      else stack.splice(at, 0, placed);
    }
  }

  return {
    glyphs: '/glyphs/{fontstack}/{range}.pbf',
    layers: stack,
    sources: {
      coastline: { data: '/map/coastline.geojson', type: 'geojson' },
      land: { data: '/map/land.geojson', type: 'geojson' },
      rivers: { data: '/map/rivers.geojson', type: 'geojson' },
      ...Object.assign({}, ...layers.map(layer => layer.sources)),
    },
    version: 8,
  };
};
