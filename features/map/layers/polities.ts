// The page passes `polityLayer` to the client map; its `filters` is a function.
'use client';

import type { ExpressionSpecification } from 'maplibre-gl';

import type { Layer } from '@ks/features/map/types';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { dateFilter } from '@ks/features/map/filter';

// Every colour and width comes from the `map` section of design/tokens.json.
const { map } = resolveTokens(rawTokens);
const { default: FALLBACK_FILL, ...FILLS } = map.polity;

const LOW_CONFIDENCE: ExpressionSpecification = [
  '==',
  ['get', 'confidence'],
  'low',
];

// The spread has no fixed length, which the tuple type of an expression can't express.
const fillColour = [
  'match',
  ['get', 'polity'],
  ...Object.entries(FILLS).flat(),
  FALLBACK_FILL,
] as unknown as ExpressionSpecification;

/** The "Polity borders" row: the fills, borders and labels the Map date filters. */
export const polityLayer: Layer = {
  filters: day => ({
    'polity-borders': dateFilter(day, 'boundary', ['!', LOW_CONFIDENCE]),
    'polity-borders-low': dateFilter(day, 'boundary', LOW_CONFIDENCE),
    'polity-fills': dateFilter(day, 'boundary'),
    'polity-labels': dateFilter(day, 'label'),
  }),
  id: 'polities',
  layers: [
    {
      before: 'rivers',
      id: 'polity-fills',
      paint: { 'fill-color': fillColour },
      source: 'polities',
      type: 'fill',
    },
    {
      id: 'polity-borders',
      paint: {
        'line-color': map.border.colour,
        'line-width': map.border.width,
      },
      source: 'polities',
      type: 'line',
    },
    {
      id: 'polity-borders-low',
      paint: {
        'line-color': map.border.colour,
        'line-dasharray': [map.border['dash-on'], map.border['dash-off']],
        'line-width': map.border.width,
      },
      source: 'polities',
      type: 'line',
    },
    {
      id: 'polity-labels',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Public Sans SemiBold'],
        'text-letter-spacing': map['polity-label'].tracking,
        'text-max-width': map['polity-label']['max-width'],
        'text-size': map['polity-label'].size,
        'text-transform': 'uppercase',
      },
      paint: {
        'text-color': map['polity-label'].colour,
        'text-halo-color': map['label-halo'].colour,
        'text-halo-width': map['label-halo'].width,
      },
      source: 'polities',
      type: 'symbol',
    },
  ],
  sources: { polities: { data: '/data/polities', type: 'geojson' } },
};
