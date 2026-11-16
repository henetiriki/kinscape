import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';

/** The page of an id that names no Person in the Viewer's Tree (PPL-01). */
export const PersonNotFound = ({
  email,
  initial,
  onSignOut,
}: {
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
}) => (
  <ColumnLayout
    column='notice'
    header={
      <PageHeader
        avatar={
          <AccountMenu email={email} initial={initial} onSignOut={onSignOut} />
        }
        backHref='/people'
        backLabel='People'
      />
    }>
    <NoticeCard
      actions={[{ href: '/people', label: 'Go to People' }]}
      icon='people'
      size='large'
      title='Person not found'>
      No one in your Tree has this address. The person may have been deleted, or
      the link is wrong.
    </NoticeCard>
  </ColumnLayout>
);
