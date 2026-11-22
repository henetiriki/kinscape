import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { SelectField } from '@ks/app/components/forms/SelectField';

// EXP-03
it('is a native select named by its label, with a state', () => {
  const onChange = vi.fn();

  render(
    <SelectField
      label='Person'
      onChange={onChange}
      options={[
        { label: 'Anyone', value: 'any' },
        { label: 'Maria', value: 'maria' },
      ]}
      state='hover'
    />
  );

  const select = screen.getByRole('combobox', { name: 'Person' });

  expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
    'Anyone',
    'Maria',
  ]);
  // eslint-disable-next-line testing-library/no-node-access -- the box span has no role; the test checks its data-state
  expect(select.parentElement!.dataset.state).toBe('hover');
  fireEvent.change(select, { target: { value: 'maria' } });
  expect(onChange).toHaveBeenCalledOnce();
});

// PIN-02
it('shows an error in place of nothing: error box, icon, alert and aria links', () => {
  const { container } = render(
    <SelectField
      error='Choose a polity.'
      label='Polity'
      options={[{ label: 'Anyone', value: 'any' }]}
    />
  );

  const select = screen.getByRole('combobox', { name: 'Polity' });
  const alert = screen.getByRole('alert');

  expect(alert.textContent).toBe('Choose a polity.');
  expect(select.getAttribute('aria-invalid')).toBe('true');
  expect(select.getAttribute('aria-describedby')).toBe(alert.id);
  // eslint-disable-next-line testing-library/no-node-access -- the box span has no role; the test checks its data-mark
  expect(select.parentElement!.dataset.mark).toBe('error');
  // eslint-disable-next-line testing-library/no-node-access -- the chevron and error icons are aria-hidden svgs; no query reaches them
  expect(select.parentElement!.querySelectorAll('svg')).toHaveLength(2);
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the error icon is an aria-hidden svg; the test checks that it comes last in the box
  expect(container.querySelector('[data-mark] > svg:last-child')).toBeTruthy();
});

// PIN-02
it('joins a given aria-describedby with the error id', () => {
  render(
    <SelectField
      aria-describedby='other'
      error='Choose a polity.'
      label='Polity'
      options={[{ label: 'Anyone', value: 'any' }]}
    />
  );

  expect(
    screen
      .getByRole('combobox', { name: 'Polity' })
      .getAttribute('aria-describedby')
  ).toBe(`other ${screen.getByRole('alert').id}`);
});

// PIN-02
it('has no mark, alert or description without an error', () => {
  render(
    <SelectField label='Polity' options={[{ label: 'Anyone', value: 'any' }]} />
  );

  const select = screen.getByRole('combobox', { name: 'Polity' });

  // eslint-disable-next-line testing-library/no-node-access -- the box span has no role; the test checks that it has no data-mark
  expect(select.parentElement!.hasAttribute('data-mark')).toBe(false);
  expect(select.hasAttribute('aria-invalid')).toBe(false);
  expect(select.hasAttribute('aria-describedby')).toBe(false);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('names a select whose label is hidden', () => {
  render(
    <SelectField
      hideLabel
      label='Person, hover'
      options={[{ label: 'Anyone', value: 'any' }]}
    />
  );

  screen.getByRole('combobox', { name: 'Person, hover' });
  expect(screen.queryByText('Person, hover')).toBeNull();
});
