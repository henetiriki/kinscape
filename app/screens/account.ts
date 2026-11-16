import { accountInitial } from '@ks/lib/domain/auth/initial.mts';

const EMAIL = 'researcher@example.com';

/** The synthetic Account of the `/screens` pages: its email and the avatar letter. */
export const SAMPLE_ACCOUNT = { email: EMAIL, initial: accountInitial(EMAIL) };
