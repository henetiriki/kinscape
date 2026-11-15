import type { Metadata } from 'next';

import { RelationshipsScreen } from '@ks/app/screens/relationships';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationship details: parent' };

const Page = async () => {
  await requireDevPage();

  return <RelationshipsScreen picking={{ group: 'parents', picked: 'o7' }} />;
};

export default Page;
