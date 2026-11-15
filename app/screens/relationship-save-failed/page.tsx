import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationship save failed' };

const Page = async () => {
  await requireDevPage();

  return (
    <RelationshipsScreen
      picking={{ group: 'children', picked: 'o11', shown: 'failed' }}
    />
  );
};

export default Page;
