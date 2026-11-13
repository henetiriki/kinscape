import type { Metadata } from 'next';

import { z } from 'zod';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PeopleList } from '@ks/features/people';
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

/** The People page (PPL-01). A read that throws or finds no Tree shows the load-failed state. */
const People = async () => {
  const session = await requireSession();
  const people = await listPeople(undefined).catch(() => undefined);

  return (
    <PeopleList
      email={session.email}
      failed={people?.ok !== true}
      // An Account has no name, so the Avatar shows the first letter of the email.
      initial={session.email.charAt(0).toUpperCase()}
      onSignOut={signOutAction}
      people={people?.ok ? people.value : []}
    />
  );
};

export default People;
