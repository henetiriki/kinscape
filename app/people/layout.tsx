import type { ReactNode } from 'react';

import { SavedToast } from '@ks/features/people';
import { requireSession } from '@ks/server/auth/current.mts';

/**
 * Holds the saved toast, so it shows on `/people` after the form returns there. It checks the
 * session before the `loading.tsx` boundary: a page's redirect inside that boundary comes after
 * the 200 status is sent. Each page still checks the session itself.
 */
const PeopleLayout = async ({ children }: { children: ReactNode }) => {
  await requireSession();

  return <SavedToast>{children}</SavedToast>;
};

export default PeopleLayout;
