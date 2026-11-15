import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

  describe('on a phone', () => {
    const desktop = window.matchMedia;

    beforeEach(() => {
      window.matchMedia = (() => ({
        addEventListener: () => {},
        matches: true,
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = desktop;
    });

    // PPL-01
    it('draws the heading as the phone page title', () => {
      render(<PeopleLoading />);

      expect(screen.getByRole('heading', { name: 'People' }).className).toBe(
        'h1Phone'
      );
    });
  });
});
