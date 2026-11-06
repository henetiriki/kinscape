import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('answers 401, with no body, under /data/ with no cookie', () => {
    const response = proxy(request('/data/polities'));

    expect(response.status).toBe(401);
    expect(response.body).toBeNull();
  });

  it('treats an empty cookie as none', () => {
    const response = proxy(request('/', `${SESSION_COOKIE}=`));

    expect(response.status).toBe(307);
  });

  it('ignores a cookie with another name', () => {
    expect(proxy(request('/', 'other=1')).status).toBe(307);
  });
});

// NFR-03: outside Preview and development the design kit and screens are 404, whatever the cookie.
describe('proxy, with the dev pages hidden', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const hide = () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
  };

  it.each(['/design-kit', '/design-kit/colour', '/screens/add-pin'])(
    'answers 404 for %s, with or without a session cookie',
    path => {
      hide();

      for (const cookie of [undefined, `${SESSION_COOKIE}=anything`]) {
        const response = proxy(request(path, cookie));

        expect(response.status).toBe(404);
        expect(response.headers.get('location')).toBeNull();
      }
    }
  );

  it('leaves other pages to the cookie check', () => {
    hide();

    expect(proxy(request('/')).status).toBe(307);
  });

  it('lets them through on a Preview deployment', () => {
    hide();
    vi.stubEnv('VERCEL_ENV', 'preview');

    expect(proxy(request('/design-kit')).status).toBe(307);
  });
});

// NFR-03
describe('the matcher', () => {
  it.each([
    '/',
    '/design-kit',
    '/design-kit/colour',
    '/screens/add-pin',
    '/data/polities',
    '/data/zz',
    '/people/j.smith',
  ])('covers %s', path => {
    expect(matches(path)).toBe(true);
  });

  it.each([
    '/sign-in',
    '/sign-in/anything',
    '/_next/static/chunk.js',
    '/map/land.geojson',
    '/glyphs/Public Sans SemiBold/0-255.pbf',
    '/robots.txt',
    '/favicon.ico',
  ])('skips %s', path => {
    expect(matches(path)).toBe(false);
  });

  it('still covers a page whose name starts like sign-in', () => {
    expect(matches('/sign-installed')).toBe(true);
  });
});
