import type { Metadata, Viewport } from 'next';

import { z } from 'zod';

import { createPersonAction, updatePersonAction } from '@ks/app/people/actions';
import { signOutAction } from '@ks/app/sign-in/actions';
import { PersonForm, PersonNotFound } from '@ks/features/people';
import { parsePersonId } from '@ks/lib/domain/ids/ids.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { requireSession } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Edit a person' };

// The Action bar clears a home bar only when the page covers the whole screen.
export const viewport: Viewport = { viewportFit: 'cover' };

/** The Person in the Viewer's Tree; one in another Account's Tree reads as none. */
const readPerson = treeAction(z.string(), async (tree, text) => {
  const id = parsePersonId(text);

  return ok(id && (await tree.persons.get(id)));
});

/**
 * The page that edits a Person (PPL-01). An id that is no UUID, names no Person, or names one in
 * another Account's Tree shows the not-found state. The form is keyed by the version, so Reload
 * after a conflict starts it again from the saved Person.
 */
const EditPerson = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireSession();
  const found = await readPerson(id);
  const person = found.ok ? found.value : undefined;
  const header = {
    email: session.email,
    // An Account has no name, so the Avatar shows the first letter of the email.
    initial: session.email.charAt(0).toUpperCase(),
    onSignOut: signOutAction,
  };

  return person === undefined ? (
    <PersonNotFound {...header} />
  ) : (
    <PersonForm
      {...header}
      create={createPersonAction}
      key={person.version}
      person={person}
      update={updatePersonAction}
    />
  );
};

export default EditPerson;
