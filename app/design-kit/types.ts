import type { BOARDS } from './boards';

export type Board = (typeof BOARDS)[number];

export type Label = {
  caps?: boolean;
  italic?: boolean;
  key: LabelKey;
  weight: 400 | 500 | 600;
};

type LabelKey =
  | 'contested-label'
  | 'context-label'
  | 'place-label'
  | 'polity-label'
  | 'river-label'
  | 'water-label';
