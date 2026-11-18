import { describe, expect, it } from 'vitest';

import { devPagesVisible, isDevPage } from '@ks/server/dev-pages.mts';

// NFR-03: the screens are an allowlist, so an unset or unknown value hides them.
describe('devPagesVisible', () => {
  it.each([
    [{ NODE_ENV: 'development' }],
    [{ NODE_ENV: 'test' }],
    [{ NODE_ENV: 'production', VERCEL_ENV: 'preview' }],
    [{ KINSCAPE_DEV_PAGES: '1', NODE_ENV: 'production' }],
  ])('shows them for %j', env => {
    expect(devPagesVisible(env)).toBe(true);
  });

  it.each([
    [{}],
    [{ NODE_ENV: 'staging' }],
    [{ NODE_ENV: 'production' }],
    [{ NODE_ENV: 'production', VERCEL_ENV: 'production' }],
    [{ NODE_ENV: 'production', VERCEL_ENV: '' }],
    [{ NODE_ENV: 'production', VERCEL_ENV: 'Preview' }],
    [{ KINSCAPE_DEV_PAGES: 'true', NODE_ENV: 'production' }],
  ])('hides them for %j', env => {
    expect(devPagesVisible(env)).toBe(false);
  });
});

describe('isDevPage', () => {
  it.each(['/screens', '/screens/', '/screens/add-pin'])('covers %s', path => {
    expect(isDevPage(path)).toBe(true);
  });

  it.each(['/', '/screensaver', '/sign-in', '/data/screens'])(
    'leaves %s',
    path => {
      expect(isDevPage(path)).toBe(false);
    }
  );
});
