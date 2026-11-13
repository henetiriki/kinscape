import type { Metadata } from 'next';

import { PeopleScreen } from '@ks/app/screens/people';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'People, load failed' };

const Page = async () => {
  await requireDevPage();

  return <PeopleScreen failed people={[]} />;
};

export default Page;
