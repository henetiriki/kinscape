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

  screen.getByRole('dialog', { name: 'Pin details' });
  expect(screen.getByText('Residence').textContent).toBe('Residence');
  screen.getByRole('heading', { level: 3, name: 'Example Person' });
  expect(screen.getByText('From 1890 to 1905').textContent).toBe(
    'From 1890 to 1905'
  );
  expect(screen.getByText('FROM 1890 TO 1905').textContent).toBe(
    'FROM 1890 TO 1905'
  );
  expect(screen.getByText('Address as recorded').textContent).toBe(
    'Address as recorded'
  );
  screen.getByText('Farm Example, district Example');
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the event glyph is aria-hidden with no role or text
  const glyph = container.querySelector('[data-event="residence"]');

  expect(glyph?.getAttribute('aria-hidden')).toBe('true');
});

it('shows a note for an address that is empty', () => {
  show({ address: '' });

  expect(screen.getByText('No address recorded').textContent).toBe(
    'No address recorded'
  );
});

// PIN-02: the Pin of the map holds the event type and both date lines
it('shows the event type and both date lines with bars in place of the name and address while loading', () => {
  const { container } = show({
    address: undefined,
    name: undefined,
    state: 'loading',
  });

  expect(screen.getByText('Residence').textContent).toBe('Residence');
  expect(screen.getByText('From 1890 to 1905').textContent).toBe(
    'From 1890 to 1905'
  );
  expect(screen.getByText('FROM 1890 TO 1905').textContent).toBe(
    'FROM 1890 TO 1905'
  );
  expect(screen.queryByRole('heading')).toBeNull();
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- a bar is an aria-hidden span with no role or text
  expect(container.querySelectorAll('[data-bar]').length).toBe(2);
});

it('marks each form busy while loading, and no form busy otherwise', () => {
  const { rerender } = render(
    <PinPopup
      event='residence'
      reading='In 1890'
      recorded='1890'
      state='loading'
    />
  );

  expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBe('true');
  rerender(
    <PinPopup
      event='residence'
      form='sheet'
      reading='In 1890'
      recorded='1890'
      state='loading'
    />
  );
  expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('true');
  rerender(
    <PinPopup
      event='residence'
      form='inline'
      reading='In 1890'
      recorded='1890'
      state='loading'
    />
  );
  expect(screen.getByRole('group').getAttribute('aria-busy')).toBe('true');
  rerender(
    <PinPopup
      event='residence'
      form='inline'
      name='A B'
      reading='In 1890'
      recorded='1890'
      state='loaded'
    />
  );
  expect(screen.getByRole('group').hasAttribute('aria-busy')).toBe(false);
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
  expect(screen.getByText('From 1890 to 1905').textContent).toBe(
    'From 1890 to 1905'
  );
  expect(screen.queryByText('Address as recorded')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});

// NFR-05
it('has "Add a pin here" and "Edit" on a desktop, and neither on a phone', () => {
  const { unmount } = show();

  screen.getByRole('button', { name: 'Add a pin here' });
  screen.getByRole('button', { name: 'Edit' });

  unmount();
  show({ form: 'sheet' });

  expect(screen.queryByRole('button', { name: 'Add a pin here' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  expect(
    screen.getByText(
      'Look-up only on a phone. Add people and pins on a tablet or computer.'
    ).textContent
  ).toBe(
    'Look-up only on a phone. Add people and pins on a tablet or computer.'
  );
});

it('draws the sheet as a labelled region with a handle, and the failed sheet has "Try again"', () => {
  show({ form: 'sheet', state: 'failed' });

  screen.getByRole('region', { name: 'Pin details, failed' });
  screen.getByRole('button', { name: 'Try again' });
});

it('names the sheet by its state', () => {
  show({ form: 'sheet' });

  screen.getByRole('region', { name: 'Pin details, loaded' });
});

it('draws the inline form as a group with no handle, for the date sheet', () => {
  const { container } = show({ form: 'inline' });

  screen.getByRole('group', { name: 'Pin details' });
  // The note is a sibling of the group, at the foot of the sheet.
  expect(
    screen.getByRole('group').contains(screen.getByText(/^Look-up only/))
  ).toBe(false);
  expect(screen.queryByRole('region')).toBeNull();
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the handle is an aria-hidden span with no role or text
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
  // eslint-disable-next-line testing-library/no-node-access -- the root div has no role; the test checks its style
  const placed = container.firstElementChild as HTMLElement;

  expect(placed.style.getPropertyValue('--x')).toBe('120px');
  expect(placed.style.getPropertyValue('--y')).toBe('80px');
  expect(placed.style.getPropertyValue('--gap')).toBe(
    'var(--layout-pin-popup-gap)'
  );
  expect(screen.getByText('Birth').textContent).toBe('Birth');
});
