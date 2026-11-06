import { afterEach, describe, expect, it, vi } from 'vitest';

import nextConfig, { securityHeaders } from '@ks/next.config';

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; " +
  "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";

afterEach(() => {
  vi.unstubAllEnvs();
});

// NFR-03
describe('next.config', () => {
  it('sends noindex and the security headers on every response', async () => {
    expect(await nextConfig.headers?.()).toEqual([
      {
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          ...securityHeaders(false),
        ],
        source: '/:path*',
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
    expect(securityHeaders(false)).toEqual([
      { key: 'Content-Security-Policy', value: CSP },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ]);
  });
});
