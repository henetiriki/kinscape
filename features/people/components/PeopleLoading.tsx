'use client';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';

import styles from '@ks/features/people/components/PeopleLoading.module.css';

/**
 * The People page while the server renders it (PPL-01): the header with no Avatar, the heading
 * and a notice. The list page draws its own header when it arrives.
 */
export const PeopleLoading = () => (
  <ColumnLayout
    column='list'
    header={<PageHeader backHref='/' backLabel='Map' />}>
    <div className={styles.top}>
      <Text as='h1' variant='h1'>
        People
      </Text>
    </div>
    <div className={styles.empty}>
      <NoticeCard icon='people' size='large' title='Loading people'>
        Your Tree is on its way.
      </NoticeCard>
    </div>
  </ColumnLayout>
);
