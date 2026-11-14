import type { Metadata } from 'next';

import { PersonNotFoundScreen } from '@ks/app/screens/person';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Person not found' };

const Page = async () => {
  await requireDevPage();

  return <PersonNotFoundScreen />;
};

export default Page;
