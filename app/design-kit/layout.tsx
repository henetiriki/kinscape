import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { Text } from '@ks/app/components/foundation/Text';
import { KitMenu } from '@ks/app/design-kit/KitMenu';
import { KitNav, KitTitle } from '@ks/app/design-kit/KitNav';
import { currentSession } from '@ks/server/auth/current.mts';

import styles from '@ks/app/design-kit/layout.module.css';

export const metadata: Metadata = {
  title: {
    default: 'KinScape design kit',
    template: '%s · KinScape design kit',
  },
};

const DesignKitLayout = async ({ children }: { children: ReactNode }) => {
  if ((await currentSession()) === undefined) {
    redirect('/sign-in');
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
