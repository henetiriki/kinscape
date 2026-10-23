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

  // Five rows for nine boards, so the sixth starts the second column
  expect(screen.getByRole('list').style.getPropertyValue('--rows')).toBe('5');

  expect(rows).toHaveLength(BOARDS.length);
  BOARDS.forEach(({ eyebrow, line, slug, title }, i) => {
    const row = within(rows[i]);

    expect(row.getByRole('link', { name: title }).getAttribute('href')).toBe(
      `/design-kit/${slug}`
    );
    expect(row.getByText(line)).toBeTruthy();
    expect(row.getByText(eyebrow)).toBeTruthy();
  });
});
