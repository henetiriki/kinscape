import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { notFound, redirect } from 'next/navigation';

import { currentSession } from '@ks/server/auth/current.mts';

import styles from '@ks/app/screens/layout.module.css';

export const metadata: Metadata = {
  title: {
    default: 'KinScape screens',
    template: '%s · KinScape screens',
  },
};

/** Built screens with sample data, for the design check; the map's colour stands in for the map. */
const ScreensLayout = async ({ children }: { children: ReactNode }) => {
  // Vercel sets VERCEL_ENV at build, so in production every screen is built as a 404.
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  if ((await currentSession()) === undefined) {
    redirect('/sign-in');
  }

  return <div className={styles.screen}>{children}</div>;
};

export default ScreensLayout;
