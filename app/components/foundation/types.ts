import type { ComponentPropsWithoutRef, ComponentType } from 'react';

import type { MARKS, PATHS } from '@ks/app/components/foundation/Icon';

/** A state that a component card shows without the pointer or keyboard; the real states come from the browser. */
export type ControlState = 'active' | 'focus' | 'hover';

export type FilledIconName = keyof typeof MARKS;

export type Heading = 'display' | 'h1' | 'h2' | 'h3';
export type IconName = keyof typeof PATHS;

export type IconSize = 14 | 16 | 18 | 20 | 24 | 28;

/** What a kit link renders: a plain anchor, or a component that takes the anchor props. */
export type LinkComponent =
  'a' | ComponentType<{ href: string } & ComponentPropsWithoutRef<'a'>>;

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
  | 'overlineTight'
  | 'small'
  | 'title';
export type SurfaceLevel = 'floating' | 'modal' | 'raised' | 'sheet';

export type Tone = 'error' | 'info' | 'warning';
