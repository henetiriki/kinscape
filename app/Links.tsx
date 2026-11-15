'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import Link from 'next/link';

import { LinkContext } from '@ks/app/components/foundation/link';

/** `next/link` with the prefetch off: a long list would prefetch one route for each row in view. */
const KitLink = (props: { href: string } & ComponentPropsWithoutRef<'a'>) => (
  <Link {...props} prefetch={false} />
);

/** Gives the kit links `next/link`: a click moves in the browser, and a modified click opens a tab. */
export const Links = ({ children }: { children: ReactNode }) => (
  <LinkContext.Provider value={KitLink}>{children}</LinkContext.Provider>
);
