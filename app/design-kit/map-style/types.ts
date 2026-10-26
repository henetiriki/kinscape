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
