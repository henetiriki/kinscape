import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Avatar } from '@/app/components/map/Avatar';

// NFR-05, NFR-06
it('is closed unless told it is open', () => {
  render(<Avatar initial='L' />);
  expect(
    screen
      .getByRole('button', { name: 'Account menu' })
      .getAttribute('aria-expanded')
  ).toBe('false');
});

it('draws a state and its open look', () => {
  render(<Avatar expanded initial='L' state='hover' />);

  const avatar = screen.getByRole('button', { name: 'Account menu' });

  expect(avatar.getAttribute('data-state')).toBe('hover');
  expect(avatar.getAttribute('aria-expanded')).toBe('true');
});
