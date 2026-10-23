import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { CheckboxField } from '../CheckboxField';

// NFR-06
it('describes the checkbox by its description, which is not a live region', () => {
  render(
    <CheckboxField
      description='Only people born before 1920.'
      label='Deceased'
    />
  );

  const box = screen.getByRole('checkbox', { name: 'Deceased' });
  const description = screen.getByText('Only people born before 1920.');

  expect(box.getAttribute('aria-describedby')).toBe(description.id);
  expect(description.getAttribute('aria-live')).toBeNull();
  expect(description.getAttribute('role')).toBeNull();
});

it('toggles on a click of the label text', () => {
  render(<CheckboxField label='Deceased' />);

  const box = screen.getByRole('checkbox') as HTMLInputElement;

  expect(box.getAttribute('aria-describedby')).toBeNull();
  fireEvent.click(screen.getByText('Deceased'));
  expect(box.checked).toBe(true);
});

it('can be disabled and shows a state', () => {
  render(<CheckboxField disabled label='Deceased' state='hover' />);

  const box = screen.getByRole('checkbox') as HTMLInputElement;

  expect(box.disabled).toBe(true);
  expect(box.dataset.state).toBe('hover');
});
