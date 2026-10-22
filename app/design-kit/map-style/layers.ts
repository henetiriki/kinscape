import { resolveTokens } from '@/lib/design/tokens.mts';

import rawTokens from '../../../design/tokens.json';

const { colour, map } = resolveTokens(rawTokens);

const hex = (value: string) => value.toUpperCase();

export type Layer = {
  covers: string[];
  filter: string;
  id: string;
  preview: PreviewKind;
  properties: string;
  type: string;
};

export type PreviewKind =
  | 'background'
  | 'cluster'
  | 'coastline'
  | 'contested'
  | 'district'
  | 'glyphs'
  | 'halo'
  | 'hillshade'
  | 'land'
  | 'line-approx'
  | 'line-changed'
  | 'line'
  | 'place-dot'
  | 'place-label'
  | 'polity-label'
  | 'polity'
  | 'ring'
  | 'river-label'
  | 'river'
  | 'water-label';

// Values the tokens lack (opacity 0.6, illumination 315°, cluster radius 40) are text, as designed.
export const LAYERS: Layer[] = [
  {
    covers: ['MAP-02'],
    filter: '—',
    id: 'background',
    preview: 'background',
    properties: `background-color ${hex(map.sea)}`,
    type: 'background',
  },
  {
    covers: ['MAP-01', 'MAP-02'],
    filter: 'Coastline polygon (land only)',
    id: 'land',
    preview: 'land',
    properties: `fill-color ${hex(map.land)}`,
    type: 'fill',
  },
  {
    covers: ['MAP-04', 'MAP-05', 'BND-01'],
    filter: 'boundaries.geojson · onDate',
    id: 'polity-fill',
    preview: 'polity',
    properties: 'fill-color match polity_id → tint · fill-opacity 0.6',
    type: 'fill',
  },
  {
    covers: ['BND-04'],
    filter: 'same · contested == true',
    id: 'polity-contested',
    preview: 'contested',
    properties: 'fill-pattern "hatch-contested" (9 px tile)',
    type: 'fill',
  },
  {
    covers: ['MAP-02'],
    filter: 'raster-dem tiles',
    id: 'hillshade',
    preview: 'hillshade',
    properties: `shadow ${hex(map.hillshade.shadow)} · highlight ${hex(map.hillshade.highlight)} · exaggeration ${map.hillshade.exaggeration} · illumination 315°`,
    type: 'hillshade',
  },
  {
    covers: ['MAP-02'],
    filter: 'Coastline line',
    id: 'coastline',
    preview: 'coastline',
    properties: `line-color ${hex(map.coastline.colour)} · line-width ${map.coastline.width}`,
    type: 'line',
  },
  {
    covers: ['MAP-02'],
    filter: 'rivers.geojson',
    id: 'rivers',
    preview: 'river',
    properties: `line-color ${hex(map.river.colour)} · line-width interpolate zoom ${map.river['zoom-min']}→${map.river['width-min']}, ${map.river['zoom-max']}→${map.river['width-max']}`,
    type: 'line',
  },
  {
    covers: ['MAP-05'],
    filter: 'districts.geojson · onDate · off by default',
    id: 'district-line',
    preview: 'district',
    properties: `line-color ${hex(map.district.colour)} · line-width ${map.district.width}`,
    type: 'line',
  },
  {
    covers: ['BND-01'],
    filter: 'boundaries · confidence != low',
    id: 'polity-line',
    preview: 'line',
    properties: `line-color ${hex(map.border.colour)} · line-width ${map.border.width} · line-join round`,
    type: 'line',
  },
  {
    covers: ['BND-05'],
    filter: 'boundaries · confidence == low',
    id: 'polity-line-approx',
    preview: 'line-approx',
    properties: `as above · line-dasharray [${map.border['dash-on']}, ${map.border['dash-off']}]`,
    type: 'line',
  },
  {
    covers: ['MAP-11'],
    filter: 'boundaries · id in changedIds',
    id: 'boundary-changed',
    preview: 'line-changed',
    properties: `line-color ${hex(map.changed.colour)} · line-width ${map.changed.width} · line-opacity faded in JS`,
    type: 'line',
  },
  {
    covers: ['MAP-06'],
    filter: 'Ocean label points',
    id: 'water-label',
    preview: 'water-label',
    properties: `text-font Italic · text-letter-spacing ${map['water-label'].tracking} · text-color ${hex(map['water-label'].colour)}`,
    type: 'symbol',
  },
  {
    covers: ['MAP-06'],
    filter: 'rivers.geojson',
    id: 'river-label',
    preview: 'river-label',
    properties: 'symbol-placement line · text-font Italic',
    type: 'symbol',
  },
  {
    covers: ['MAP-06', 'BND-02'],
    filter: 'polity-names.geojson · onDate',
    id: 'polity-label',
    preview: 'polity-label',
    properties: `text-field format [upcase name, "\\n", note (italic, font-scale 0.85)] · text-letter-spacing ${map['polity-label'].tracking} · text-halo-color ${hex(map['label-halo'].colour)} · text-halo-width ${map['label-halo'].width}`,
    type: 'symbol',
  },
  {
    covers: ['BND-08'],
    filter: 'place-names.geojson · onDate',
    id: 'place-dot',
    preview: 'place-dot',
    properties: `circle-radius ${map['place-dot'].radius} · circle-color ${hex(map['place-dot'].colour)} · circle-stroke ${hex(map['place-dot'].stroke)} ${map['place-dot']['stroke-width']}`,
    type: 'circle',
  },
  {
    covers: ['MAP-06', 'BND-08'],
    filter: 'place-names.geojson · onDate',
    id: 'place-label',
    preview: 'place-label',
    properties: `text-variable-anchor [left, right, top] · text-radial-offset 0.6 · text-halo-width ${map['label-halo'].width}`,
    type: 'symbol',
  },
  {
    covers: ['EXP-02'],
    filter: 'pins.geojson · pinsOn · fuzzy only',
    id: 'pin-halo',
    preview: 'halo',
    properties: `circle-radius from uncertainty_days · circle-color ${hex(map['pin-halo'].colour)} · circle-opacity ${map['pin-halo'].opacity} · circle-blur ${map['pin-halo'].blur}`,
    type: 'circle',
  },
  {
    covers: ['EXP-01', 'EXP-03', 'PIN-03'],
    filter: 'pins.geojson · pinsOn · filters',
    id: 'pins',
    preview: 'glyphs',
    properties: `icon-image match event_type → SDF · icon-color ${hex(map.pin.colour)} · icon-halo ${hex(map.pin.halo)} ${map.pin['halo-width']} · icon-opacity ${map.pin['fuzzy-opacity']} when fuzzy`,
    type: 'symbol',
  },
  {
    covers: ['EXP-08'],
    filter: 'pins source, cluster: true, clusterRadius 40',
    id: 'pin-cluster',
    preview: 'cluster',
    properties: `circle-color ${hex(map.pin.colour)} · text-field point_count_abbreviated`,
    type: 'circle + symbol',
  },
  {
    covers: ['MAP-07'],
    filter: 'One clicked point',
    id: 'selection',
    preview: 'ring',
    properties: `circle-radius ${map.selected.radius} · circle-opacity 0 · circle-stroke-color ${hex(map.selected.colour)} · circle-stroke-width ${map.selected.width}`,
    type: 'circle',
  },
];

export const LEGEND = [
  { colour: colour.brand, name: 'Brand' },
  { colour: map.pin.colour, name: 'Pins' },
  { colour: map.border.colour, name: 'Borders' },
] as const;
