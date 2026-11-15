'use client';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { usePhone } from '@ks/app/components/foundation/usePhone';

import styles from '@ks/features/people/components/PeopleList.module.css';

/**
 * The People page while the server renders it (PPL-01): the header with no Avatar, the heading
 * and a notice. The list page draws its own header when it arrives.
 */
export const PeopleLoading = () => {
  const phone = usePhone();

  return (
    <div className={styles.page}>
      <PageHeader backHref='/' backLabel='Map' />
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.top}>
            <Text as='h1' variant={phone ? 'h1Phone' : 'h1'}>
              People
            </Text>
          </div>
          <div className={styles.empty}>
            <NoticeCard icon='people' size='large' title='Loading people'>
              Your Tree is on its way.
            </NoticeCard>
          </div>
        </div>
      </main>
    </div>
  );
};
