import { afterEach, describe, expect, it, vi } from 'vitest';

import nextConfig, { securityHeaders } from '@ks/next.config';

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; " +
  "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";

afterEach(() => {
  vi.unstubAllEnvs();
});

// NFR-03, NFR-09
describe('next.config', () => {
  it('sends noindex and the security headers on every response, and no-store on /people', async () => {
    expect(await nextConfig.headers?.()).toEqual([
      {
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          ...securityHeaders({ dev: false, preview: false }),
        ],
        source: '/:path*',
      },
      {
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
        source: '/people/:path*',
      },
    ]);
  });

  it('drops X-Powered-By', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('allows eval only in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const [rule] = (await nextConfig.headers?.()) ?? [];

    expect(rule?.headers).toContainEqual({
      key: 'Content-Security-Policy',
      value: CSP.replace(
        "script-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      ),
    });
  });
});

// NFR-03
describe('securityHeaders', () => {
  it('locks the page to its own origin and turns off what the app never uses', () => {
    expect(securityHeaders({ dev: false, preview: false })).toEqual([
      { key: 'Content-Security-Policy', value: CSP },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ]);
  });

  it('lets the Vercel Toolbar load on a Preview deployment only', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');

    const [rule] = (await nextConfig.headers?.()) ?? [];
    const csp = rule?.headers.find(
      header => header.key === 'Content-Security-Policy'
    )?.value;

    expect(csp).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; " +
        "style-src 'self' 'unsafe-inline' https://vercel.live; " +
        "img-src 'self' data: blob: https://vercel.live https://vercel.com; " +
        "font-src 'self' https://vercel.live https://assets.vercel.com; " +
        "worker-src 'self' blob:; " +
        "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com; " +
        'frame-src https://vercel.live; ' +
        "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
    );
    expect(
      securityHeaders({ dev: false, preview: false })[0]?.value
    ).not.toContain('vercel');
  });
});
