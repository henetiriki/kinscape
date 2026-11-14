'use client';

import type { ReactNode } from 'react';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';

import styles from '@ks/features/people/components/EditOnComputer.module.css';

/**
 * Shows its form on desktop. On a phone it shows a notice and a link to the list instead, because
 * a phone only looks people up (PPL-01, NFR-05).
 */
export const EditOnComputer = ({
  children,
  email,
  initial,
  onSignOut,
}: {
  children: ReactNode;
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
}) => {
  const phone = usePhone();

  if (!phone) {
    return children;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        avatar={
          <AccountMenu email={email} initial={initial} onSignOut={onSignOut} />
        }
        backHref='/people'
        backLabel='People'
      />
      <main className={styles.main}>
        <NoticeCard
          actions={[{ href: '/people', label: 'See all people' }]}
          phone
          title='Edit people on a computer'>
          People are added and edited on a larger screen. On a phone you can
          look them up.
        </NoticeCard>
      </main>
    </div>
  );
};
