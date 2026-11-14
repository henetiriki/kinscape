import type { Metadata } from 'next';

import { PersonScreen, SAMPLE_PERSON } from '@ks/app/screens/person';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Edit a person' };

const Page = async () => {
  await requireDevPage();

  return <PersonScreen person={SAMPLE_PERSON} />;
};

export default Page;
