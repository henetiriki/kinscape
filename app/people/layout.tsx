import type { ReactNode } from 'react';

import { unstable_rethrow } from 'next/navigation';

import { SavedToast } from '@ks/features/people';
import { requireSession } from '@ks/server/auth/current.mts';

/**
 * Holds the saved toast, so it shows on `/people` after the form returns there. It checks the
 * session before the `loading.tsx` boundary, because the server sends the 200 status before a
 * redirect inside that boundary. Any other error reaches the page, which shows its own
 * load-failed state. Each page still checks the session itself.
 */
const PeopleLayout = async ({ children }: { children: ReactNode }) => {
  await requireSession().catch(error => {
    unstable_rethrow(error);
  });

  return <SavedToast>{children}</SavedToast>;
};

export default PeopleLayout;
