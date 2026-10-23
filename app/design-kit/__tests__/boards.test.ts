import { expect, it } from 'vitest';

import screens from '../../../design/screens.json';
import { BOARDS } from '../boards';

// NFR-06: a board checked against its snapshot is listed in the kit's nav and index.
it('has a row for each /design-kit/* route in screens.json', () => {
  const routes = screens.screens
    .map(screen => screen.route.split('?')[0])
    .filter(route => route.startsWith('/design-kit/'));

  expect(routes.length).toBeGreaterThan(0);

  for (const route of routes) {
    expect(
      BOARDS.map(board => `/design-kit/${board.slug}`),
      `boards.ts has no row for ${route}`
    ).toContain(route);
  }
});
