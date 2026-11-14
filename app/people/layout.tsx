import type { ReactNode } from 'react';

import { SavedToast } from '@ks/features/people';

/** Holds the saved toast, so it shows on `/people` after the form returns there. */
const PeopleLayout = ({ children }: { children: ReactNode }) => (
  <SavedToast>{children}</SavedToast>
);

export default PeopleLayout;
