'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import { LinkContext } from '@ks/app/components/foundation/link';

/** Gives the kit links `next/link`: a click moves in the browser, and a modified click opens a tab. */
export const Links = ({ children }: { children: ReactNode }) => (
  <LinkContext.Provider value={Link}>{children}</LinkContext.Provider>
);
