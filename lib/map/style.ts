import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';

import { dateFilter } from './filter';

/** The layers the "Polity borders" row shows and hides together. */
export const POLITY_LAYERS = [
  'polity-fills',
  'polity-borders',
  'polity-borders-low',
  'polity-labels',
] as const;

// Fills from design/DESIGN.md › Map style; the rest are muted tints of similar lightness.
const FILLS: Record<string, string> = {
  'eastern-cape': '#D9D3BC',
  eswatini: '#CBD6DA',
  'free-state': '#E3D2B2',
  gauteng: '#D6CCBA',
  'kwazulu-natal': '#DCD3BD',
  lesotho: '#D9CFD9',
  limpopo: '#D4D9C0',
  mpumalanga: '#DAD0B6',
  'north-west': '#D9CFBA',
  'northern-cape': '#DDD6BE',
  'western-cape': '#D3DCC4',
};

const FALLBACK_FILL = '#DCD3BD';

const LAND = '#E9EBE2';
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
        paint: { 'background-color': '#C9D5D2' },
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
          'line-color': '#6E99A3',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 8, 3],
        },
        source: 'rivers',
        type: 'line',
      },
      {
        id: 'coastline',
        paint: { 'line-color': '#7E9A98', 'line-width': 0.9 },
        source: 'coastline',
        type: 'line',
      },
      {
        filter: filters['polity-borders'],
        id: 'polity-borders',
        layout: { visibility },
        paint: { 'line-color': '#3B3A2F', 'line-width': 1.5 },
        source: 'polities',
        type: 'line',
      },
      {
        filter: filters['polity-borders-low'],
        id: 'polity-borders-low',
        layout: { visibility },
        paint: {
          'line-color': '#3B3A2F',
          'line-dasharray': [4, 2.6],
          'line-width': 1.5,
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
          'text-letter-spacing': 0.15,
          'text-max-width': 6,
          'text-size': 12,
          'text-transform': 'uppercase',
          visibility,
        },
        paint: {
          'text-color': '#2E2C22',
          'text-halo-color': LAND,
          'text-halo-width': 1.5,
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
