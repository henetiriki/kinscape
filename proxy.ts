import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@ks/server/auth/sessions.mts';

/**
 * The quick half of the sign-in gate: no session cookie means the sign-in page, with where the
 * request was going. Whether the cookie is real is checked where the data is served.
 */
export const proxy = (request: NextRequest) => {
  if (request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const signIn = new URL('/sign-in', request.url);

  signIn.searchParams.set('returnTo', pathname + search);

  return NextResponse.redirect(signIn);
};

// Skipped: the sign-in page, Next's own files, `/data/` (its route answers 401 itself) and any
// path with a file extension.
export const config = {
  matcher: '/((?!sign-in(?:/|$)|_next/|data/|.*\\.).*)',
};
