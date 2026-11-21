import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { PinPopup, PlacedPinPopup } from '@ks/app/components/overlays/PinPopup';

const show = (props: Partial<Parameters<typeof PinPopup>[0]> = {}) =>
  render(
    <PinPopup
      address='Farm Example, district Example'
      event='residence'
      form='floating'
      name='Example Person'
      reading='From 1890 to 1905'
      recorded='FROM 1890 TO 1905'
      state='loaded'
      {...props}
    />
  );

// PIN-02
it('shows the event type, name, both date lines and the address when loaded', () => {
  const { container } = show();

  expect(screen.getByRole('dialog', { name: 'Pin details' })).toBeTruthy();
  expect(screen.getByText('Residence')).toBeTruthy();
  expect(
    screen.getByRole('heading', { level: 3, name: 'Example Person' })
  ).toBeTruthy();
  expect(screen.getByText('From 1890 to 1905')).toBeTruthy();
  expect(screen.getByText('FROM 1890 TO 1905')).toBeTruthy();
  expect(screen.getByText('Address as recorded')).toBeTruthy();
  expect(screen.getByText('Farm Example, district Example')).toBeTruthy();
  expect(
    container
      .querySelector('[data-event="residence"]')
      ?.getAttribute('aria-hidden')
  ).toBe('true');
});

it('shows a note for an address that is empty', () => {
  show({ address: '' });

  expect(screen.getByText('No address recorded')).toBeTruthy();
});

// PIN-02: the Pin of the map holds the event type and both date lines
it('shows the event type and both date lines with bars in place of the name and address while loading', () => {
  const { container } = show({
    address: undefined,
    name: undefined,
    state: 'loading',
  });

  expect(screen.getByText('Residence')).toBeTruthy();
  expect(screen.getByText('From 1890 to 1905')).toBeTruthy();
  expect(screen.getByText('FROM 1890 TO 1905')).toBeTruthy();
  expect(screen.queryByRole('heading')).toBeNull();
  expect(container.querySelectorAll('[data-bar]').length).toBe(2);
});

it('disables "Add a pin here" and "Edit" while loading', () => {
  show({ address: undefined, name: undefined, state: 'loading' });

  expect(
    (
      screen.getByRole('button', {
        name: 'Add a pin here',
      }) as HTMLButtonElement
    ).disabled
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Edit' }) as HTMLButtonElement).disabled
  ).toBe(true);
});

it('shows an error alert and "Try again" when failed, and asks again on a press', () => {
  const onRetry = vi.fn();

  show({ address: undefined, name: undefined, onRetry, state: 'failed' });

  expect(screen.getByRole('alert').textContent).toContain(
    "Couldn't load this Pin"
  );
  expect(screen.getByText('From 1890 to 1905')).toBeTruthy();
  expect(screen.queryByText('Address as recorded')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});

// NFR-05
it('has "Add a pin here" and "Edit" on a desktop, and neither on a phone', () => {
  const { unmount } = show();

  expect(screen.getByRole('button', { name: 'Add a pin here' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();

  unmount();
  show({ form: 'sheet' });

  expect(screen.queryByRole('button', { name: 'Add a pin here' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  expect(
    screen.getByText(
      'Look-up only on a phone. Add people and pins on a tablet or computer.'
    )
  ).toBeTruthy();
});

it('draws the sheet as a labelled region with a handle, and the failed sheet has "Try again"', () => {
  show({ form: 'sheet', state: 'failed' });

  expect(
    screen.getByRole('region', { name: 'Pin details, failed' })
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});

it('names the sheet by its state', () => {
  show({ form: 'sheet' });

  expect(
    screen.getByRole('region', { name: 'Pin details, loaded' })
  ).toBeTruthy();
});

it('draws the inline form as a group with no handle, for the date sheet', () => {
  const { container } = show({ form: 'inline' });

  expect(screen.getByRole('group', { name: 'Pin details' })).toBeTruthy();
  expect(screen.queryByRole('region')).toBeNull();
  expect(container.querySelector('[aria-hidden="true"]:not(svg)')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
});

it('closes on the Close button and on Esc', () => {
  const onClose = vi.fn();

  show({ onClose });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'a' });

  expect(onClose).toHaveBeenCalledTimes(2);
});

it('closes the sheet from its Close button', () => {
  const onClose = vi.fn();

  show({ form: 'sheet', onClose });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('places the popup at a point in pixels', () => {
  const { container } = render(
    <PlacedPinPopup
      address='Farm Example'
      event='birth'
      name='Example Person'
      reading='In 1890'
      recorded='1890'
      state='loaded'
      x={120}
      y={80}
    />
  );
  const placed = container.firstElementChild as HTMLElement;

  expect(placed.style.getPropertyValue('--x')).toBe('120px');
  expect(placed.style.getPropertyValue('--y')).toBe('80px');
  expect(screen.getByText('Birth')).toBeTruthy();
});
