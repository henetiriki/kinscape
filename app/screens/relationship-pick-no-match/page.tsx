import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = {
  title: 'Relationship picker, no match',
};

const Page = async () => {
  await requireDevPage();

  return (
    <RelationshipsScreen picking={{ group: 'parents', query: 'Pretorius' }} />
  );
};

export default Page;
