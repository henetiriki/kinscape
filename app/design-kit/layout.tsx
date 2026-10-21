import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { notFound } from 'next/navigation';

import { Text } from '@/app/components/Text';

import { KitNav } from './KitNav';
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
      {/* The design check hides the banner, so each board is shot from its own top. */}
      <header className={styles.banner} data-design-hide>
        {/* A paragraph, so each page's own title is its top heading. */}
        <Text as='p' variant='h3'>
          KinScape design kit
        </Text>
        <KitNav />
      </header>
      {children}
    </>
  );
};

export default DesignKitLayout;
