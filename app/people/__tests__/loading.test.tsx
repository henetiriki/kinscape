import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import Loading from '@ks/app/people/loading';

// PPL-01
it('shows the loading screen for a People page', () => {
  render(<Loading />);

  expect(screen.getByRole('status').textContent).toContain('Loading people');
});
