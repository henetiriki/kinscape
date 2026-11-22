import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const addPin = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/@map/useAddPin', () => ({ useAddPin: addPin }));
vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

import Page, { metadata } from '@ks/app/screens/pin-form/page';

// PIN-01. Data is synthetic.
it('puts the button of the add-pin hook in the action slot of the map frame', async () => {
  addPin.mockReturnValue({ action: <button type='button'>Add a pin</button> });
  render(await Page());

  expect(document.querySelector('[data-slot="action"]')?.textContent).toBe(
    'Add a pin'
  );
  screen.getByRole('complementary', { name: 'Layers and filters' });
  expect(addPin.mock.calls[0][0].onSaved).toBeInstanceOf(Function);
  addPin.mock.calls[0][0].onSaved();
});

it('puts the panel of the hook in the place of the tabbed panel', async () => {
  addPin.mockReturnValue({ panel: <p>The form panel</p> });
  render(await Page());

  expect(document.querySelector('[data-slot="panel"]')?.textContent).toBe(
    'The form panel'
  );
  expect(
    screen.queryByRole('complementary', { name: 'Layers and filters' })
  ).toBeNull();
});

it('titles the page', () => {
  expect(metadata.title).toBe('Add a pin');
});
