import type { ReactNode } from 'react';

import rawTokens from '@ks/design/tokens.json';

import styles from '@ks/features/map/components/Stage.module.css';

const { layout, size } = rawTokens;
const px = (value: string) => Number.parseFloat(value);

/** The free map area as map padding: what the `overlay` slot leaves, from the same tokens. */
export const freeArea = (phone: boolean) =>
  phone
    ? {
        bottom: px(layout.phone['sheet-collapsed']),
        left: px(size['gutter-phone']),
        right: px(size['gutter-phone']),
        top: px(layout.phone['overlay-top']),
      }
    : {
        bottom: px(layout['furniture-bottom']) + px(layout['dock-height']),
        left: px(layout['dock-left']),
        right: px(size.gutter),
        top: px(layout['furniture-top']),
      };

/** The slots, in the order they stack; a phone shows `layers` and hides `account`, `zoom` and `credits`. */
const SLOTS = [
  'search',
  'account',
  'zoom',
  'layers',
  'panel',
  'dock',
  'credits',
  'overlay',
] as const;

type Slot = (typeof SLOTS)[number];

/**
 * The map screen's frame: the map is `children`, and each slot is a placed box over it.
 * Desktop and phone forms switch at `breakpoint`; every edge is a `layout` token.
 * The `overlay` content centres unless `overlayAt` is `top`, which puts it at the slot's top edge.
 */
export const Stage = ({
  children,
  overlayAt,
  ...slots
}: {
  children?: ReactNode;
  overlayAt?: 'top';
} & Partial<Record<Slot, ReactNode>>) => (
  <div className={styles.stage}>
    {children}
    {SLOTS.map(
      slot =>
        slots[slot] && (
          <div
            className={styles[slot]}
            data-at={slot === 'overlay' ? overlayAt : undefined}
            data-slot={slot}
            key={slot}>
            {slots[slot]}
          </div>
        )
    )}
  </div>
);
