import type { Metadata, Viewport } from 'next';

import { createPersonAction, updatePersonAction } from '@ks/app/people/actions';
import { signOutAction } from '@ks/app/sign-in/actions';
import { EditOnComputer, PersonForm } from '@ks/features/people';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';
import { requireSession } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Add a person' };

// The Action bar clears a home bar only when the page covers the whole screen.
export const viewport: Viewport = { viewportFit: 'cover' };

/** The page that creates a Person (PPL-01). */
const NewPerson = async () => {
  const session = await requireSession();

  const header = {
    email: session.email,
    initial: accountInitial(session.email),
    onSignOut: signOutAction,
  };

  return (
    <EditOnComputer {...header}>
      <PersonForm
        {...header}
        create={createPersonAction}
        update={updatePersonAction}
      />
    </EditOnComputer>
  );
};

export default NewPerson;
