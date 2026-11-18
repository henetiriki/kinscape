import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { SAMPLE_ACCOUNT } from '@ks/app/screens/account';
import { signOutAction } from '@ks/app/sign-in/actions';
import { PeopleList } from '@ks/features/people';

/** The People page in one state, with a synthetic Account. */
export const PeopleScreen = ({
  failed,
  people,
}: {
  failed?: boolean;
  people: PersonSummary[];
}) => (
  <PeopleList
    {...SAMPLE_ACCOUNT}
    failed={failed}
    onSignOut={signOutAction}
    people={people}
  />
);
