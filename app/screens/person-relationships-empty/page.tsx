import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Person relationships, empty' };

const Page = async () => {
  await requireDevPage();

  return <RelationshipsScreen empty />;
};

export default Page;
