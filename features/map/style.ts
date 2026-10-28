import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';

import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { dateFilter } from '@ks/lib/map/filter';

/** The layers the "Polity borders" row shows and hides together. */
export const POLITY_LAYERS = [
  'polity-fills',
  'polity-borders',
  'polity-borders-low',
  'polity-labels',
] as const;

// Every colour and width comes from the `map` section of design/tokens.json.
const { map } = resolveTokens(rawTokens);
const { default: FALLBACK_FILL, ...FILLS } = map.polity;

const LAND = map.land;
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

/** The filter for each polity layer on `day`. */
export const polityFilters = (
  day: number
): Record<(typeof POLITY_LAYERS)[number], ExpressionSpecification> => ({
  'polity-borders': dateFilter(day, 'boundary', ['!', LOW_CONFIDENCE]),
  'polity-borders-low': dateFilter(day, 'boundary', LOW_CONFIDENCE),
  'polity-fills': dateFilter(day, 'boundary'),
  'polity-labels': dateFilter(day, 'label'),
});

/** The map's style: the basemap and the polity layers filtered to `day`. */
export const buildStyle = (day: number, showPolities: boolean) => {
  const filters = polityFilters(day);
  const visibility = showPolities ? 'visible' : 'none';

  return {
    glyphs: '/glyphs/{fontstack}/{range}.pbf',
    layers: [
      {
        id: 'background',
        paint: { 'background-color': map.sea },
        type: 'background',
      },
      {
        id: 'land',
        paint: { 'fill-color': LAND },
        source: 'land',
        type: 'fill',
      },
      {
        filter: filters['polity-fills'],
        id: 'polity-fills',
        layout: { visibility },
        paint: { 'fill-color': fillColour },
        source: 'polities',
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
      {
        filter: filters['polity-borders'],
        id: 'polity-borders',
        layout: { visibility },
        paint: {
          'line-color': map.border.colour,
          'line-width': map.border.width,
        },
        source: 'polities',
        type: 'line',
      },
      {
        filter: filters['polity-borders-low'],
        id: 'polity-borders-low',
        layout: { visibility },
        paint: {
          'line-color': map.border.colour,
          'line-dasharray': [map.border['dash-on'], map.border['dash-off']],
          'line-width': map.border.width,
        },
        source: 'polities',
        type: 'line',
      },
      {
        filter: filters['polity-labels'],
        id: 'polity-labels',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Public Sans SemiBold'],
          'text-letter-spacing': map['polity-label'].tracking,
          'text-max-width': map['polity-label']['max-width'],
          'text-size': map['polity-label'].size,
          'text-transform': 'uppercase',
          visibility,
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
    sources: {
      coastline: { data: '/map/coastline.geojson', type: 'geojson' },
      land: { data: '/map/land.geojson', type: 'geojson' },
      polities: { data: '/data/polities', type: 'geojson' },
      rivers: { data: '/map/rivers.geojson', type: 'geojson' },
    },
    version: 8,
  } satisfies StyleSpecification;
};
