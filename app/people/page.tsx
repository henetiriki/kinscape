import type { Metadata } from 'next';

import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PeopleList } from '@ks/features/people';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';
import { shortFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { requireSession } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'People' };

/** The Viewer's Persons, as rows. The notes stay on the server. */
const listPeople = treeAction(z.undefined(), async tree =>
  ok(
    (await tree.persons.list()).map(person => ({
      born: person.birth ? shortFuzzyDate(person.birth) : '—',
      deceased: person.deceased,
      died: person.death ? shortFuzzyDate(person.death) : '',
      givenNames: person.givenNames,
      id: person.id,
      maidenName: person.maidenName,
      surname: person.surname,
      variants: person.variants,
    }))
  )
);

/**
 * Next's own errors, such as the sign-in redirect, pass through. Any other error leaves a log of
 * its name only: its message can hold Person data. The page then shows the load-failed state.
 */
const failed = (error: unknown): undefined => {
  unstable_rethrow(error);
  console.error(
    'People page failed:',
    error instanceof Error ? error.name : 'unknown'
  );
};

/**
 * The People page (PPL-01). A lookup or read that throws, or finds no Tree, shows the load-failed
 * state. With no session, the Avatar has no initial and its menu no email.
 */
const People = async () => {
  const session = await requireSession().catch(failed);
  const people = session && (await listPeople(undefined).catch(failed));

  return (
    <PeopleList
      email={session?.email ?? ''}
      failed={people?.ok !== true}
      initial={session ? accountInitial(session.email) : '?'}
      onSignOut={signOutAction}
      people={people?.ok ? people.value : []}
    />
  );
};

export default People;
