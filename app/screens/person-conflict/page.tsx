import type { Metadata } from 'next';

import { PersonScreen, SAMPLE_PERSON } from '@ks/app/screens/person';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Edit a person, conflict' };

/** The edit form; the check presses Save, and the stand-in action reports another tab's save. */
const Page = async () => {
  await requireDevPage();

  return (
    <PersonScreen
      person={{
        ...SAMPLE_PERSON,
        notes:
          'Her baptism record spells the family name Rossau. Six children are named in the family Bible.',
      }}
      save='conflict'
    />
  );
};

export default Page;
