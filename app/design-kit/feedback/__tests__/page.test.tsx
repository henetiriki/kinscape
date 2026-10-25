import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import FeedbackKit from '../page';

// MAP-03, NFR-06
it('shows the eight cases, each a live field with its message', () => {
  render(<FeedbackKit />);

  const titles = [
    'Default',
    'Typing',
    'Wrong format',
    'Before 1652',
    'After today',
    "Doesn't exist",
    'Warning',
    'Info',
  ];
  const cards = titles.map(
    title => screen.getAllByText(title)[0].parentElement!
  );

  expect(
    cards.map(
      card => (within(card).getByRole('textbox') as HTMLInputElement).value
    )
  ).toEqual([
    '1901',
    '1901-0',
    '14/06/1901',
    '1650',
    '2031',
    '1901-02-30',
    '1750',
    '1901-06',
  ]);
  expect(within(cards[2]).getByRole('alert').textContent).toBe(
    'Use 1901, 1901-06 or 1901-06-14.'
  );
  expect(within(cards[3]).getByRole('button').textContent).toBe('Go to 1652');
  expect(within(cards[4]).getByRole('button').textContent).toBe('Go to today');
  expect(within(cards[5]).getByRole('button').textContent).toBe(
    'Go to 1901-02-28'
  );
  expect(within(cards[0]).queryByRole('alert')).toBeNull();
  expect(within(cards[1]).queryByRole('alert')).toBeNull();
  expect(within(cards[6]).getByRole('status').textContent).toBe(
    'No borders are mapped for 1750 yet.'
  );
  expect(within(cards[7]).getByRole('status').textContent).toBe(
    'Switched to month precision.'
  );
});

it('draws the step buttons in the cards as boxes that are not controls', () => {
  render(<FeedbackKit />);

  const card = screen.getByText('Default').parentElement!;

  expect(within(card).queryAllByRole('button')).toHaveLength(0);
  expect(card.querySelectorAll('[aria-hidden="true"].step')).toHaveLength(2);
});

it('holds the last good date a card is given', () => {
  render(<FeedbackKit />);

  const field = within(screen.getByText('Default').parentElement!).getByRole(
    'textbox'
  ) as HTMLInputElement;

  fireEvent.change(field, { target: { value: '1902-3' } });
  fireEvent.keyDown(field, { key: 'Enter' });
  expect(field.value).toBe('1902-03');

  fireEvent.change(field, { target: { value: '1902-02-30' } });
  fireEvent.keyDown(field, { key: 'Enter' });
  fireEvent.keyDown(field, { key: 'Escape' });
  expect(field.value).toBe('1902-03');
});

// The dock is the first sample; the phone date sheet follows it.
const samples = () =>
  screen
    .getAllByRole('button', { name: 'Back one day' })
    .map(button => button.parentElement!.parentElement!.parentElement!);

it('shows the dock with the message above the field, naming the date the map shows', () => {
  render(<FeedbackKit />);

  const [dock] = samples();

  expect(within(dock).getByRole('alert').textContent).toBe(
    'February 1901 has 28 days. The map still shows 1901-02-28. Press Esc to go back to it.Go to 1901-02-28'
  );
  expect(within(dock).getByRole('radio', { name: 'Day' })).toBeTruthy();
});

it('shows the phone date sheet with the fix and a Play button', () => {
  render(<FeedbackKit />);

  const sheet = samples()[1].parentElement!;

  expect(
    within(sheet).getByRole('button', { name: 'Go to 1901-02-28' })
  ).toBeTruthy();
  expect(
    within(sheet).getByRole('button', { name: 'Play through time' })
  ).toBeTruthy();
  expect(within(sheet).queryByRole('radio')).toBeNull();
});

it('steps the dock by a day', () => {
  render(<FeedbackKit />);

  const [dock] = samples();
  const field = within(dock).getByRole('textbox') as HTMLInputElement;

  fireEvent.click(
    within(dock).getByRole('button', { name: 'Forward one day' })
  );
  expect(field.value).toBe('1901-03-01');
  fireEvent.click(within(dock).getByRole('button', { name: 'Back one day' }));
  fireEvent.click(within(dock).getByRole('button', { name: 'Back one day' }));
  expect(field.value).toBe('1901-02-27');
});

it('shows four alerts with their roles, two toasts and the banner', () => {
  render(<FeedbackKit />);

  const alerts = screen.getByRole('heading', {
    name: 'Alerts',
  }).nextElementSibling!;

  expect(alerts.textContent).toContain('role=alert');
  expect(alerts.textContent?.match(/role=status/g)).toHaveLength(3);
  expect(
    screen.getByText('Jurisdiction chain copied.').closest('[role=status]')
  ).toBeTruthy();
  expect(
    screen.getByText("The export didn't finish.").closest('[role=alert]')
  ).toBeTruthy();
  expect(
    screen.getByText("Terrain didn't load.").closest('[role=alert]')
  ).toBeTruthy();
});

it('lists the behaviour and shows the form fields', () => {
  render(<FeedbackKit />);

  expect(
    screen.getByRole('heading', { name: 'Behaviour' }).nextElementSibling!
      .children
  ).toHaveLength(8);

  const [helped, failed] = screen.getAllByRole('textbox', { name: 'Email' });

  expect(helped.getAttribute('aria-invalid')).toBeNull();
  expect(failed.getAttribute('aria-invalid')).toBe('true');
  expect(
    screen.getByText('Add the rest of the address, like name@example.com.')
  ).toBeTruthy();
});
