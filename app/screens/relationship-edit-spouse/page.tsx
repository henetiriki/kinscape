import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationship edit: spouse' };

const Page = async () => {
  await requireDevPage();

  return <RelationshipsScreen edit='s1' />;
};

export default Page;
