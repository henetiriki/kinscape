import type { Metadata } from 'next';

import { unstable_rethrow } from 'next/navigation';

import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people';
import type { PersonView } from '@ks/lib/domain/persons/types.ts';
import type { LinkedPerson } from '@ks/lib/domain/relationships/types.ts';

import { signOutAction } from '@ks/app/sign-in/actions';
import { PersonNotFound, PersonRelationships } from '@ks/features/people';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';
import { parsePersonId } from '@ks/lib/domain/ids/ids.mts';
import { idField } from '@ks/lib/domain/ids/schemas.mts';
import { personDates, spouseDates } from '@ks/lib/domain/persons/dates.mts';
import {
  groupRelationships,
  linkedPersonIds,
} from '@ks/lib/domain/relationships/groups.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { requireSession } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Relationships' };

/** The Person in the Viewer's Tree; one in another Account's Tree reads as none. */
const readPerson = treeAction(idField(parsePersonId), async (tree, id) =>
  ok(await tree.persons.get(id))
);

const entryOf = ({
  person,
  relationship,
}: LinkedPerson): RelationshipEntry => ({
  ...personDates(person),
  ...(relationship.type === 'parent'
    ? { subtype: relationship.subtype }
    : spouseDates(relationship)),
  givenNames: person.givenNames,
  id: relationship.id,
  surname: person.surname,
});

/**
 * The links of one Person, in three groups. It reads only the Persons at the other ends, and sends
 * only their names and dates.
 */
const readLinks = treeAction(idField(parsePersonId), async (tree, id) => {
  const relationships = await tree.relationships.list();
  const others = linkedPersonIds(id, relationships);
  const read = await Promise.all(others.map(other => tree.persons.get(other)));
  const people = new Map(
    read.flatMap(person => (person ? [[person.id, person] as const] : []))
  );
  const groups = groupRelationships(id, relationships, people);

  return ok({
    children: groups.children.map(entryOf),
    parents: groups.parents.map(entryOf),
    spouses: groups.spouses.map(entryOf),
  });
});

/**
 * Next's own errors, such as the sign-in redirect, pass through. Any other error leaves a log of
 * its name only: its message can hold Person data. The page then shows the load-failed state.
 */
const failed = (error: unknown): undefined => {
  unstable_rethrow(error);
  console.error(
    'Relationships page failed:',
    error instanceof Error ? error.name : 'unknown'
  );
};

const headingOf = (person: PersonView): RelationshipsPerson => ({
  ...personDates(person),
  givenNames: person.givenNames,
  id: person.id,
  surname: person.surname,
});

/**
 * The Relationships page of a Person (PPL-02). An id that is no UUID, names no Person, or names one
 * in another Account's Tree shows the not-found state. A read that throws shows the load-failed
 * notice. If the read of the Person throws, the notice has no name.
 */
const PersonLinks = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireSession();
  const header = {
    email: session.email,
    initial: accountInitial(session.email),
    onSignOut: signOutAction,
  };
  const found = await readPerson(id).catch(failed);

  if (found === undefined) {
    return <PersonRelationships {...header} failed />;
  }

  const person = found.ok ? found.value : undefined;

  if (person === undefined) {
    return <PersonNotFound {...header} />;
  }

  const links = await readLinks(person.id).catch(failed);

  return links?.ok ? (
    <PersonRelationships
      {...header}
      groups={links.value}
      person={headingOf(person)}
    />
  ) : (
    <PersonRelationships {...header} failed person={headingOf(person)} />
  );
};

export default PersonLinks;
