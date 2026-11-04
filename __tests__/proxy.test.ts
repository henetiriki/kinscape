import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from '@ks/proxy';
import { SESSION_COOKIE } from '@ks/server/auth/sessions.mts';

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie === undefined ? {} : { cookie },
  });

const matches = (path: string) => new RegExp(`^${config.matcher}$`).test(path);

// NFR-03
describe('proxy', () => {
  it('lets a request with a session cookie through', () => {
    const response = proxy(request('/', `${SESSION_COOKIE}=anything`));

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('sends a request with no cookie to the sign-in page, with where it was going', () => {
    const response = proxy(request('/screens/add-pin?step=2'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?returnTo=%2Fscreens%2Fadd-pin%3Fstep%3D2'
    );
  });

  it('treats an empty cookie as none', () => {
    const response = proxy(request('/', `${SESSION_COOKIE}=`));

    expect(response.status).toBe(307);
  });

  it('ignores a cookie with another name', () => {
    expect(proxy(request('/', 'other=1')).status).toBe(307);
  });
});

// NFR-03
describe('the matcher', () => {
  it.each(['/', '/design-kit', '/design-kit/colour', '/screens/add-pin'])(
    'covers the page %s',
    path => {
      expect(matches(path)).toBe(true);
    }
  );

  it.each([
    '/sign-in',
    '/sign-in/anything',
    '/_next/static/chunk.js',
    '/data/polities',
    '/map/land.geojson',
    '/robots.txt',
    '/favicon.ico',
  ])('skips %s', path => {
    expect(matches(path)).toBe(false);
  });

  it('still covers a page whose name starts like sign-in', () => {
    expect(matches('/sign-installed')).toBe(true);
  });
});
