'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import styles from '@ks/app/MapHost.module.css';

/**
 * Holds the layout's `@map` slot. On `/` it shows the map. Under `/people` it hides the map but
 * keeps it mounted: `inert` and `visibility: hidden` take it from the keyboard and from screen
 * readers, and the box keeps its size so MapLibre gets no resize. Elsewhere it drops the map, so
 * sign-out starts a new one.
 */
export const MapHost = ({ children }: { children: ReactNode }) => {
  const path = usePathname();
  const onPeople = path === '/people' || path.startsWith('/people/');

  if (path !== '/' && !onPeople) {
    return null;
  }

  return (
    <div
      className={styles.host}
      data-hidden={onPeople ? '' : undefined}
      inert={onPeople}>
      {children}
    </div>
  );
};
