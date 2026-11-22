'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import styles from '@ks/app/MapHost.module.css';

/**
 * Holds the layout's `@map` slot. On `/` it shows the map. Under `/people` it hides the map and
 * keeps it mounted. `inert` and `visibility: hidden` take the map from the keyboard and from
 * screen readers. The box keeps its size, so MapLibre gets no resize. On other routes it drops
 * the map, so sign-out starts a new one.
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
      data-testid='map-host'
      inert={onPeople}>
      {children}
    </div>
  );
};
