import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { notFound } from 'next/navigation';

import { Text } from '@/app/components/Text';

import { KitMenu } from './KitMenu';
import { KitNav, KitTitle } from './KitNav';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: {
    default: 'KinScape design kit',
    template: '%s · KinScape design kit',
  },
};

const DesignKitLayout = ({ children }: { children: ReactNode }) => {
  // Vercel sets VERCEL_ENV at build, so in production every kit page is built as a 404.
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  return (
    <>
      <header className={styles.banner}>
        {/* A paragraph, so each page's own title is its top heading. */}
        <Text as='p' variant='h3'>
          <KitTitle />
        </Text>
        <KitNav />
        <KitMenu />
      </header>
      {children}
    </>
  );
};

export default DesignKitLayout;
