import type { Metadata } from 'next';

import { PersonScreen } from '@ks/app/screens/person';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Add a person' };

const Page = async () => {
  await requireDevPage();

  return <PersonScreen />;
};

export default Page;
