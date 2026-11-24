'use client';

import { useSyncExternalStore } from 'react';

import { breakpoint } from '@ks/design/tokens.generated.ts';

// Below 640 wide or below 500 tall is a phone (Intent 104).
const { 'phone-height': height, 'phone-width': width } = breakpoint;

export const PHONE = `(max-width: ${width}), (max-height: ${height})`;

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(PHONE);

  query.addEventListener('change', notify);

  return () => query.removeEventListener('change', notify);
};

/** Whether the screen is a phone. The server renders the desktop form. */
export const usePhone = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false
  );
