import type { PersonView } from '@ks/lib/domain/persons/types.ts';

import { saveConflict, saveFailed } from '@ks/app/screens/person-actions';
import { signOutAction } from '@ks/app/sign-in/actions';
import { PersonForm, PersonNotFound } from '@ks/features/people';
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

/** The synthetic Person of the `person-edit`, `person-save-failed` and `person-conflict` boards. */
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

const ACCOUNT = { email: 'researcher@example.com', initial: 'L' };

/**
 * The Person form with a synthetic Account. Save returns the outcome that `save` names, so the
 * check can show it: `failed` is a save that did not go through, `conflict` another tab's save.
 */
export const PersonScreen = ({
  person,
  save = 'failed',
}: {
  person?: PersonView;
  save?: 'conflict' | 'failed';
}) => (
  <PersonForm
    {...ACCOUNT}
    create={saveFailed}
    onSignOut={signOutAction}
    person={person}
    update={save === 'conflict' ? saveConflict : saveFailed}
  />
);

/** The not-found page with a synthetic Account. */
export const PersonNotFoundScreen = () => (
  <PersonNotFound {...ACCOUNT} onSignOut={signOutAction} />
);
