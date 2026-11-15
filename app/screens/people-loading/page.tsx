import type { Metadata } from 'next';

import { PeopleLoading } from '@ks/features/people';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'People, loading' };

const Page = async () => {
  await requireDevPage();

  return <PeopleLoading />;
};

export default Page;
