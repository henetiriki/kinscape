import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import { BOARDS } from '../boards';
import DesignKitIndex from '../page';

// NFR-06
it('lists each board with its link and line', () => {
  render(<DesignKitIndex />);

  expect(
    screen.getByRole('heading', { level: 1, name: 'Boards' })
  ).toBeTruthy();

  const rows = screen.getAllByRole('listitem');

  expect(rows).toHaveLength(BOARDS.length);
  BOARDS.forEach(({ line, number, slug, title }, i) => {
    const row = within(rows[i]);

    expect(row.getByRole('link', { name: title }).getAttribute('href')).toBe(
      `/design-kit/${slug}`
    );
    expect(row.getByText(line)).toBeTruthy();
    expect(row.getByText(`Style guide · ${number}`)).toBeTruthy();
  });
});
