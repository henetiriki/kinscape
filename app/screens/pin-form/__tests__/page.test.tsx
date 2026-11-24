import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const addPin = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/@map/useAddPin', () => ({ useAddPin: addPin }));
vi.mock('@ks/server/auth/current.mts', () => ({ requireDevPage: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

import EditPage, {
  metadata as editMetadata,
} from '@ks/app/screens/pin-form/edit/page';
import ExistingPlacePage, {
  metadata as existingMetadata,
} from '@ks/app/screens/pin-form/existing-place/page';
import Page, { metadata } from '@ks/app/screens/pin-form/page';

// PIN-01. Data is synthetic.
it('puts the button of the add-pin hook in the action slot of the map frame', async () => {
  addPin.mockReturnValue({ action: <button type='button'>Add a pin</button> });
  render(await Page());

  expect(screen.getByTestId('action-slot').textContent).toBe('Add a pin');
  screen.getByRole('complementary', { name: 'Layers and filters' });
  expect(addPin).toHaveBeenCalledWith();
});

it('puts the panel of the hook in the place of the tabbed panel', async () => {
  addPin.mockReturnValue({ panel: <p>The form panel</p> });
  render(await Page());

  expect(screen.getByTestId('panel-slot').textContent).toBe('The form panel');
  expect(
    screen.queryByRole('complementary', { name: 'Layers and filters' })
  ).toBeNull();
});

// PIN-01, PIN-06
it('opens the panel at a synthetic Place on the existing-place page', async () => {
  const addHere = vi.fn();

  addPin.mockReturnValue({ addHere });
  render(await ExistingPlacePage());

  expect(addHere).toHaveBeenCalledExactlyOnceWith({
    id: '01900000-0000-7000-a000-0000000000c1',
    latitude: -29.12,
    longitude: 26.21,
    precision: 'farm',
  });
  expect(existingMetadata.title).toBe('Add a pin at a Place');
});

// NFR-05
it('opens nothing at a Place when the hook gives no addHere', async () => {
  addPin.mockReturnValue({});
  render(await ExistingPlacePage());

  screen.getByTestId('search-slot');
});

// PIN-02
it('opens the edit panel for a synthetic Pin on the edit page', async () => {
  const edit = vi.fn();

  addPin.mockReturnValue({ edit });
  render(await EditPage());

  expect(edit).toHaveBeenCalledExactlyOnceWith(
    '01900000-0000-7000-b000-0000000000d1'
  );
  expect(editMetadata.title).toBe('Edit a pin');
});

// NFR-05
it('opens no edit panel when the hook gives no edit', async () => {
  addPin.mockReturnValue({});
  render(await EditPage());

  screen.getByTestId('search-slot');
});

it('titles the page', () => {
  expect(metadata.title).toBe('Add a pin');
});
