import { test as setup } from '@playwright/test';

import { signIn } from '@ks/e2e/session';
import { fixtureStateFor } from '@ks/lib/design/check.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

// Signs in each fixture Account on the fixture server (port 3002) and saves its session.
for (const fixture of FIXTURES) {
  setup(`sign in as ${fixture.email}`, async ({ page }) => {
    await signIn(page, fixture, fixtureStateFor(fixture.email));
  });
}
