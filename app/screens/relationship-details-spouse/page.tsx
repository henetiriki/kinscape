import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationship details: spouse' };

const Page = async () => {
  await requireDevPage();

  return (
    <RelationshipsScreen
      picking={{ group: 'spouses', marriage: 'ABT 1875', picked: 'o8' }}
    />
  );
};

export default Page;
