import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import type { Session } from '#ks/lib/domain/auth/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { ok } from '#ks/lib/domain/result/result.mts';
import { appAdapters } from '#ks/server/adapters.mts';
import { attemptSignIn } from '#ks/server/auth/attempt.mts';
import {
  endedSessionCookie,
  endSession,
  SESSION_COOKIE,
  sessionCookie,
  sessionOf,
} from '#ks/server/auth/sessions.mts';
import { devPagesVisible } from '#ks/server/dev-pages.mts';

// The request's session, behind the app's adapters and cookie jar: the one `server/auth` entry
// that `app/` imports.

const now = () => new Date();

/** The session behind the request's cookie, or undefined; the check every gated page and route makes. */
export const currentSession = async () =>
  sessionOf(
    appAdapters().sessions,
    now,
    (await cookies()).get(SESSION_COOKIE)?.value
  );

/**
 * The session, or the sign-in page. Every page calls it before it renders anything: a layout's
 * redirect sets the status, but the page segment still renders into the response.
 */
export const requireSession = async (): Promise<Session> => {
  const session = await currentSession();

  if (session === undefined) {
    redirect('/sign-in');
  }

  return session;
};

/**
 * The check every page under `/design-kit` and `/screens` makes: 404 where those pages are hidden
 * (`devPagesVisible`), then `requireSession()`. `proxy.ts` makes the first half too.
 */
export const requireDevPage = async (): Promise<Session> => {
  if (!devPagesVisible(process.env)) {
    notFound();
  }

  return requireSession();
};

/** A sign-in from raw form input: success sets the session cookie; a failure says why. */
export const signIn = async (
  raw: unknown
): Promise<Result<void, 'refused' | 'unavailable'>> => {
  const result = await attemptSignIn(appAdapters(), now, raw);

  if (!result.ok) {
    return result;
  }

  const { name, options, value } = sessionCookie(result.value);

  (await cookies()).set(name, value, options);

  return ok(undefined);
};

/**
 * Ends the session behind the cookie and clears the cookie. A missing, malformed or unknown cookie
 * changes nothing else. If the session store throws, the error propagates and the cookie stays,
 * so signing out again retries.
 */
export const signOut = async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token !== undefined) {
    await endSession(appAdapters().sessions, token);
  }

  const { name, options, value } = endedSessionCookie();

  jar.set(name, value, options);
};
