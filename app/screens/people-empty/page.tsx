import type { Metadata } from 'next';

import { PeopleScreen } from '@ks/app/screens/people';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'People, none yet' };

const Page = async () => {
  await requireDevPage();

  return <PeopleScreen people={[]} />;
};

export default Page;
