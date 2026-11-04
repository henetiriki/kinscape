import { cookies } from 'next/headers';

import { appAdapters } from '#ks/server/adapters.mts';
import { SESSION_COOKIE, sessionOf } from '#ks/server/auth/sessions.mts';

/** The session behind the request's cookie, or undefined; the check every gated page and route makes. */
export const currentSession = async () =>
  sessionOf(
    appAdapters().sessions,
    () => new Date(),
    (await cookies()).get(SESSION_COOKIE)?.value
  );
