import type { Source } from '@ks/lib/boundaries/types.ts';

const NATURAL_EARTH = {
  attribution: 'Made with Natural Earth',
  author: 'Tom Patterson, Nathaniel Vaughn Kelso and contributors',
  dateChecked: '2026-10-19',
  licence: 'Public domain',
  licenceLink:
    'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/LICENSE.md',
};

const SIMPLIFIED =
  'Clipped to southern Africa, simplified to 500 m, coordinates rounded to 4 decimals.';

/** Board 07 draws its dialogs from this fixed list, as its mockup is, so a data change never shifts the board. */
export const SAMPLE_SOURCES: Source[] = [
  {
    ...NATURAL_EARTH,
    id: 'natural-earth-land',
    layer: 'Land',
    processing: `Natural Earth 10m v5.1.2. ${SIMPLIFIED}`,
    title: 'Natural Earth 10m land',
  },
  {
    ...NATURAL_EARTH,
    id: 'natural-earth-coastline',
    layer: 'Coastline',
    processing: `Natural Earth 10m v5.1.2. ${SIMPLIFIED}`,
    title: 'Natural Earth 10m coastline',
  },
  {
    ...NATURAL_EARTH,
    id: 'natural-earth-rivers',
    layer: 'Rivers',
    processing: `Natural Earth 10m v5.1.2, scalerank 7 and lower. ${SIMPLIFIED}`,
    title: 'Natural Earth 10m rivers and lake centerlines',
  },
  {
    ...NATURAL_EARTH,
    id: 'natural-earth-admin-1',
    layer: 'Polity borders',
    processing:
      "Natural Earth 10m v5.1.2 admin-1. South Africa's provinces, Lesotho and eSwatini, each dissolved to one shape, clipped, simplified to 500 m together with the basemap, coordinates rounded to 4 decimals. Start date 2009-04-03: Proclamation R. 20 of 2009, Government Gazette 32091, 2 April 2009 (Sixteenth Amendment). Natural Earth's lines may predate that amendment in places.",
    title: 'Natural Earth 10m admin-1 states and provinces',
  },
  {
    attribution: 'Public Sans © The Public Sans Project Authors',
    author: 'The Public Sans Project Authors',
    dateChecked: '2026-10-19',
    id: 'public-sans',
    layer: 'Polity borders',
    licence: 'SIL Open Font Licence 1.1',
    licenceLink: 'https://github.com/uswds/public-sans/blob/v2.001/OFL.txt',
    processing:
      'Version 2.001, SemiBold, converted to map glyphs (characters 0 to 511) with fontnik.',
    title: 'Public Sans',
  },
  {
    attribution: 'MapLibre',
    author: 'MapLibre contributors',
    dateChecked: '2026-10-19',
    id: 'maplibre-gl',
    layer: 'Map renderer',
    licence: 'BSD-3-Clause',
    licenceLink:
      'https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt',
    title: 'MapLibre GL JS',
  },
];
