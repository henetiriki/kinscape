import type { ReactNode } from 'react';

import { SLOTS } from '@ks/app/components/layout/slots.mts';
import { layoutPx, sizePx } from '@ks/design/tokens.generated.ts';

import styles from '@ks/app/components/layout/MapLayout.module.css';

/** The free map area as map padding: what the `overlay` slot leaves, from the same tokens. */
export const freeArea = (phone: boolean) =>
  phone
    ? {
        bottom: layoutPx.phone['sheet-collapsed'],
        left: sizePx['gutter-phone'],
        right: sizePx['gutter-phone'],
        top: layoutPx.phone['overlay-top'],
      }
    : {
        bottom: layoutPx['furniture-bottom'] + layoutPx['dock-height'],
        left: layoutPx['dock-left'],
        right: sizePx.gutter,
        top: layoutPx['furniture-top'],
      };

/** The interface declares each slot and does not map `SLOTS`: the design system reads the props from their declarations. */
interface MapLayoutSlots {
  /** The account control, on desktop. */
  account?: ReactNode;
  /** The "Add a pin" button, on desktop: 12px left of the account control. */
  action?: ReactNode;
  /** The map. */
  children?: ReactNode;
  /** The source credits, on desktop. */
  credits?: ReactNode;
  /** The date dock. */
  dock?: ReactNode;
  /** The Layers button, on a phone. */
  layers?: ReactNode;
  /** The popup area over the map. */
  overlay?: ReactNode;
  /** `top` puts the overlay at the slot's top edge; otherwise it centres. */
  overlayAt?: 'top';
  /** The side panel, or the sheet on a phone. */
  panel?: ReactNode;
  /** The search bar. */
  search?: ReactNode;
  /** The zoom controls, on desktop. */
  zoom?: ReactNode;
}

/**
 * The map screen's frame: the map is `children`, and each slot is a placed box over it.
 * Desktop and phone forms switch at `breakpoint`; every edge is a `layout` token.
 * The `overlay` content centres unless `overlayAt` is `top`, which puts it at the slot's top edge.
 */
export const MapLayout = ({
  children,
  overlayAt,
  ...slots
}: MapLayoutSlots) => (
  <div className={styles.layout}>
    {children}
    {SLOTS.map(
      slot =>
        slots[slot] && (
          <div
            className={styles[slot]}
            data-at={slot === 'overlay' ? overlayAt : undefined}
            data-slot={slot}
            data-testid={`${slot}-slot`}
            key={slot}>
            {slots[slot]}
          </div>
        )
    )}
  </div>
);
