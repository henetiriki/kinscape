import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { TextField } from '../TextField';

// NFR-06
it('names the input by its label and links the helper text', () => {
  render(<TextField helper='Where they lived.' label='Place' />);

  const input = screen.getByRole('textbox', { name: 'Place' });

  expect(input.getAttribute('aria-invalid')).toBeNull();
  expect(input.getAttribute('aria-describedby')).toBe(
    screen.getByText('Where they lived.').id
  );
  expect(screen.queryByRole('alert')).toBeNull();
});

it('names a field whose label is hidden', () => {
  render(<TextField hideLabel label='Search places' />);

  expect(screen.getByRole('textbox', { name: 'Search places' })).toBeTruthy();
  expect(screen.queryByText('Search places')).toBeNull();
});

it('shows an error in place of the helper text, with an icon and aria-invalid', () => {
  const { container } = render(
    <TextField
      error='Add the rest of the address.'
      helper='Helper'
      label='Email'
    />
  );

  const input = screen.getByRole('textbox', { name: 'Email' });
  const alert = screen.getByRole('alert');

  expect(alert.textContent).toBe('Add the rest of the address.');
  expect(screen.queryByText('Helper')).toBeNull();
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  expect(container.querySelector('[data-icon="error"]')).not.toBeNull();
});

it('marks a field without a message of its own, and keeps the caller’s description', () => {
  const { container } = render(
    <TextField aria-describedby='elsewhere' label='Date' mark='warning' />
  );

  const input = screen.getByRole('textbox', { name: 'Date' });

  expect(input.getAttribute('aria-describedby')).toBe('elsewhere');
  expect(input.getAttribute('aria-invalid')).toBeNull();
  expect(container.querySelector('[data-icon="warning"]')).not.toBeNull();
});

it('takes a state for the design kit and passes input props through', () => {
  const { container } = render(
    <TextField date disabled label='Date' placeholder='1901' state='hover' />
  );

  expect(container.querySelector('[data-state="hover"]')).not.toBeNull();
  expect(
    (screen.getByRole('textbox', { name: 'Date' }) as HTMLInputElement).disabled
  ).toBe(true);
  expect(screen.getByPlaceholderText('1901')).toBeTruthy();
});

it('switches a password field between hidden and shown', () => {
  render(
    <TextField
      defaultValue='field-notes-1901'
      label='Password'
      type='password'
    />
  );

  const input = screen.getByLabelText('Password') as HTMLInputElement;

  expect(input.type).toBe('password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input.type).toBe('text');
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(input.type).toBe('password');
});

it('starts a password shown when asked', () => {
  render(
    <TextField
      defaultShown
      defaultValue='field-notes-1901'
      label='Password'
      type='password'
    />
  );

  expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe(
    'text'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe(
    'password'
  );
});

it('disables the eye with the password field', () => {
  render(<TextField disabled label='Password' type='password' />);

  expect(
    (screen.getByRole('button', { name: 'Show password' }) as HTMLButtonElement)
      .disabled
  ).toBe(true);
});

it('takes an email type and the large size', () => {
  const { container } = render(
    <TextField label='Email' size='l' type='email' />
  );

  expect((screen.getByLabelText('Email') as HTMLInputElement).type).toBe(
    'email'
  );
  expect(container.querySelector('[data-size="l"]')).not.toBeNull();
});

it('shows a search field with its icon and a hidden key hint', () => {
  const { container } = render(
    <TextField hideLabel label='Search' shortcut='/' type='search' />
  );

  const input = screen.getByRole('searchbox', { name: 'Search' });

  expect(input.getAttribute('aria-keyshortcuts')).toBe('/');
  expect(container.querySelector('[data-icon="search"]')).not.toBeNull();
  expect(container.querySelector('kbd')!.getAttribute('aria-hidden')).toBe(
    'true'
  );
});

it('shows no key hint on a search field without a shortcut', () => {
  const { container } = render(
    <TextField hideLabel label='Search' type='search' />
  );

  expect(container.querySelector('kbd')).toBeNull();
});

it('focuses the field on its shortcut unless a text input has focus', () => {
  const { unmount } = render(
    <>
      <input aria-label='Other' />
      <TextField hideLabel label='Search' shortcut='/' type='search' />
    </>
  );

  const search = screen.getByRole('searchbox');

  fireEvent.keyDown(screen.getByLabelText('Other'), { key: '/' });
  fireEvent.keyDown(document.body, { key: 'a' });
  fireEvent.keyDown(document.body, { ctrlKey: true, key: '/' });
  fireEvent.keyDown(document.body, { altKey: true, key: '/' });
  fireEvent.keyDown(document.body, { key: '/', metaKey: true });
  expect(document.activeElement).not.toBe(search);

  // A handled key is cancelled so the "/" is not typed into the field.
  expect(fireEvent.keyDown(document.body, { key: '/' })).toBe(false);
  expect(document.activeElement).toBe(search);

  search.blur();
  fireEvent.keyDown(document, { key: '/' });
  expect(document.activeElement).toBe(search);

  search.blur();
  unmount();
  fireEvent.keyDown(document.body, { key: '/' });
  expect(document.activeElement).not.toBe(search);
});
