import type { PersonView } from '@ks/lib/domain/persons/types.ts';

import { SAMPLE_ACCOUNT as ACCOUNT } from '@ks/app/screens/account';
import { saveConflict } from '@ks/app/screens/person-actions';
import { signOutAction } from '@ks/app/sign-in/actions';
import { EditOnComputer, PersonForm } from '@ks/features/people';
import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { parsePersonId } from '@ks/lib/domain/ids/ids.mts';

// The sample texts are valid dates.
const date = (text: string) =>
  (
    parseFuzzyDate(text) as Extract<
      ReturnType<typeof parseFuzzyDate>,
      { ok: true }
    >
  ).value;

/** The synthetic Person of the `person-conflict` board. */
export const SAMPLE_PERSON: PersonView = {
  birth: date('ABT 1856'),
  death: date('14 MAR 1930'),
  deceased: true,
  givenNames: 'Maria Magdalena',
  id: parsePersonId('01900000-0000-7000-8000-0000000000a1')!,
  living: false,
  maidenName: 'Rossouw',
  notes: 'Her baptism record spells the family name Rossau.',
  sex: 'F',
  surname: 'du Toit',
  variants: ['Du Toit', 'Dutoit', 'Du Tois'],
  version: 1,
};

/** The Person form with a synthetic Account. Save reports another tab's save, so the check shows the conflict. */
export const PersonScreen = ({ person }: { person?: PersonView }) => (
  <EditOnComputer {...ACCOUNT} onSignOut={signOutAction}>
    <PersonForm
      {...ACCOUNT}
      create={saveConflict}
      onSignOut={signOutAction}
      person={person}
      update={saveConflict}
    />
  </EditOnComputer>
);
