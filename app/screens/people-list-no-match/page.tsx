import type { Metadata } from 'next';

import { PeopleScreen } from '@ks/app/screens/people';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'People, no match' };

// The design check types the query: see the `people-no-match` state.
const Page = async () => {
  await requireDevPage();

  return <PeopleScreen />;
};

export default Page;
