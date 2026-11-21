'use client';

import type { PointerEvent } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { FanPin } from '@ks/features/map/types';

import { CountMarker } from '@ks/features/map/components/CountMarker';
import { PinFan } from '@ks/features/map/components/PinFan';

import styles from '@ks/features/map/components/PlaceMarker.module.css';

/**
 * The count marker of a Place that shows several Pins, and its fan (PIN-06). A mouse fans the Pins
 * out on hover and folds them when it leaves. On touch, the first tap fans them out and a tap
 * elsewhere folds them. A click on a fan Pin opens it and folds the fan.
 */
export const PlaceMarker = ({
  onOpen,
  pins,
  selected,
}: {
  onOpen: (id: string) => void;
  pins: FanPin[];
  /** The open Pin is one of these Pins. */
  selected?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const hover = (show: boolean) => (event: PointerEvent) => {
    if (event.pointerType === 'mouse') setOpen(show);
  };

  useEffect(() => {
    if (!open) return;

    const fold = (event: globalThis.PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', fold);

    return () => document.removeEventListener('pointerdown', fold);
  }, [open]);

  const marker = (
    <CountMarker
      count={pins.length}
      onClick={() => setOpen(true)}
      selected={selected}
    />
  );

  return (
    <div
      className={open ? styles.open : undefined}
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
      ref={root}>
      {open ? (
        <PinFan
          onOpen={id => {
            setOpen(false);
            onOpen(id);
          }}
          pins={pins}>
          {marker}
        </PinFan>
      ) : (
        marker
      )}
    </div>
  );
};
