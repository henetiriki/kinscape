import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PeopleLoading } from '@ks/features/people/components/PeopleLoading';

describe('PeopleLoading', () => {
  // PPL-01
  it('shows the page title and the loading notice', () => {
    render(<PeopleLoading />);

    expect(screen.getByRole('heading', { name: 'People' }).className).toBe(
      'h1'
    );
    expect(screen.getByRole('status').textContent).toContain('Loading people');
  });
});
