import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationship cycle' };

const Page = async () => {
  await requireDevPage();

  return (
    <RelationshipsScreen
      picking={{ group: 'parents', picked: 'o4', shown: 'cycle' }}
    />
  );
};

export default Page;
