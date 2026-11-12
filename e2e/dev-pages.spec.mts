import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

// The second server in playwright.config.ts: a production build without KINSCAPE_DEV_PAGES, so the
// design kit and screens are hidden as on a production deployment. Each test starts with no session
// (below) and forges or makes its own, as the two servers may share one `session` table.
test.use({
  baseURL: 'http://localhost:3001',
  storageState: { cookies: [], origins: [] },
});

const SESSION_COOKIE = '__Host-kinscape-session';

// Every way Next asks for a page: a visit, a navigation's RSC payload, and both kinds of prefetch.
const ASKS = [
  {},
  { RSC: '1' },
  { 'Next-Router-Prefetch': '1', RSC: '1' },
  {
    'Next-Router-Prefetch': '1',
    'Next-Router-Segment-Prefetch': '<segment>',
    RSC: '1',
  },
];

// Each path with a segment to prefetch: its page, and the layout above it (the kit's bar and nav).
const PAGES = [
  ['/design-kit', '/design-kit/__PAGE__'],
  ['/design-kit', '/design-kit'],
  ['/design-kit/colour', '/design-kit/colour/__PAGE__'],
  ['/screens/add-pin', '/screens/add-pin/__PAGE__'],
  ['/screens/add-pin', '/screens'],
] as const;

const expectHidden = async (page: Page) => {
  for (const [path, segment] of PAGES) {
    for (const ask of ASKS) {
      const headers = Object.fromEntries(
        Object.entries(ask).map(([name, value]) => [
          name,
          value === '<segment>' ? segment : value,
        ])
      );
      const response = await page.request.get(path, {
        headers,
        maxRedirects: 0,
      });

      expect(response.status(), `${path} ${JSON.stringify(headers)}`).toBe(404);
    }
  }
};

// NFR-03
test('the design kit and screens are 404 with a forged session cookie', async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      domain: 'localhost',
      httpOnly: true,
      name: SESSION_COOKIE,
      path: '/',
      sameSite: 'Lax',
      secure: true,
      value: 'x'.repeat(43),
    },
  ]);

  await expectHidden(page);
});

// NFR-03
test('the design kit and screens are 404 when signed in', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('synthetic@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(url => url.pathname === '/');

  await expectHidden(page);
});
