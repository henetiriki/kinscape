import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import AddPinPage, { metadata } from '@ks/app/screens/add-pin/page';

it('puts the panel in the map screen frame, with no map', () => {
  const { container } = render(<AddPinPage />);
  const panel = container.querySelector('[data-slot="panel"]') as HTMLElement;

  expect(within(panel).getByRole('region', { name: 'Add a pin' })).toBeTruthy();
  expect(container.querySelectorAll('[data-slot]')).toHaveLength(1);
  expect(screen.queryByRole('search')).toBeNull();
});

it('titles the page', () => {
  expect(metadata.title).toBe('Add a pin');
});
