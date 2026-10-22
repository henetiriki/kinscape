import { render, screen } from '@testing-library/react';
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
