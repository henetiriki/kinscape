import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import AddPinPage, { metadata } from '@ks/app/screens/add-pin/page';

vi.mock('@ks/server/auth/current.mts', () => ({ requireSession: vi.fn() }));

it('puts the panel in the map screen frame, with no map', async () => {
  const { container } = render(await AddPinPage());
  const panel = container.querySelector('[data-slot="panel"]') as HTMLElement;

  expect(within(panel).getByRole('region', { name: 'Add a pin' })).toBeTruthy();
  expect(container.querySelectorAll('[data-slot]')).toHaveLength(1);
  expect(screen.queryByRole('search')).toBeNull();
});

it('titles the page', async () => {
  expect(metadata.title).toBe('Add a pin');
});
