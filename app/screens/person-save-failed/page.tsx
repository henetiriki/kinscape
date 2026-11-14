import type { Metadata } from 'next';

import { PersonScreen, SAMPLE_PERSON } from '@ks/app/screens/person';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Edit a person, save failed' };

/** The edit form; the check presses Save, and the stand-in action does not save. */
const Page = async () => {
  await requireDevPage();

  return <PersonScreen person={SAMPLE_PERSON} save='failed' />;
};

export default Page;
