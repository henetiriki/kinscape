import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@ks/server/auth/sessions.mts';
import { devPagesVisible, isDevPage } from '@ks/server/dev-pages.mts';

/**
 * The quick half of the sign-in gate: no session cookie means the sign-in page, with where the
 * request was going, or 401 under `/data/`, which is fetched rather than visited. Whether the
 * cookie is real is checked where the data is served. First, hidden dev pages are 404 (each page
 * checks again).
 */
export const proxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;

  if (isDevPage(pathname) && !devPagesVisible(process.env)) {
    return new NextResponse(null, { status: 404 });
  }

  if (request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/data/')) {
    return new NextResponse(null, { status: 401 });
  }

  const signIn = new URL('/sign-in', request.url);

  signIn.searchParams.set('returnTo', pathname + search);

  return NextResponse.redirect(signIn);
};

// Skipped: the sign-in page, Next's own files and the file types served from app/ and public/.
// Next reads this literal at build time; scripts/__tests__/gate.test.ts checks it against the repo.
export const config = {
  matcher:
    '/((?!sign-in(?:/|$)|_next/|.*\\.(?:css|geojson|ico|jpe?g|js|json|pbf|png|svg|txt|webmanifest|webp|woff2?|xml)$).*)',
};
