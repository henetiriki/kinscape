import type { MARKS, PATHS } from './Icon';

/** A state the design kit shows without the pointer or keyboard; the real states come from the browser. */
export type ControlState = 'active' | 'focus' | 'hover';

export type FilledIconName = keyof typeof MARKS;
export type Heading = 'display' | 'h1' | 'h2' | 'h3';

export type IconName = keyof typeof PATHS;

export type IconSize = 14 | 16 | 18 | 20 | 24 | 28;

export type Other =
  | 'body'
  | 'bodyL'
  | 'button'
  | 'buttonS'
  | 'caption'
  | 'chip'
  | 'chipOff'
  | 'control'
  | 'credits'
  | 'h1Phone'
  | 'label'
  | 'link'
  | 'linkS'
  | 'mono'
  | 'monoL'
  | 'overline'
  | 'small'
  | 'title';
export type SurfaceLevel = 'floating' | 'modal' | 'raised' | 'sheet';
export type TextVariant = Heading | Other;

export type Tone = 'error' | 'info' | 'warning';
