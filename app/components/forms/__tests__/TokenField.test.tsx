import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { TokenField } from '@/app/components/forms/TokenField';

const chips = () =>
  screen
    .getAllByRole('button')
    .map(button => button.getAttribute('aria-label'));

// EXP-03
it('removes a chip with its × and moves focus to the input', () => {
  const onChange = vi.fn();

  render(
    <TokenField
      defaultValues={['Rossouw', 'Naidoo']}
      label='Surname'
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove Rossouw' }));

  expect(chips()).toEqual(['Remove Naidoo']);
  expect(document.activeElement).toBe(screen.getByLabelText('Surname'));
  expect(onChange).toHaveBeenCalledWith(['Naidoo']);
});

it('adds the trimmed text on Enter, but not an empty or repeated one', () => {
  const onChange = vi.fn();

  render(
    <TokenField
      defaultValues={['Rossouw']}
      helper='Matches spelling variants too'
      label='Surname'
      onChange={onChange}
    />
  );

  const input = screen.getByLabelText('Surname') as HTMLInputElement;

  expect(input.getAttribute('aria-describedby')).toBe(
    screen.getByText('Matches spelling variants too').id
  );

  fireEvent.change(input, { target: { value: '  Van der Merwe ' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(chips()).toEqual(['Remove Rossouw', 'Remove Van der Merwe']);
  expect(input.value).toBe('');

  fireEvent.change(input, { target: { value: 'ROSSOUW' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(chips()).toHaveLength(2);
  expect(onChange).toHaveBeenCalledOnce();
});

it('removes the last chip on Backspace in an empty input only', () => {
  render(<TokenField defaultValues={['A', 'B']} label='Surname' />);

  const input = screen.getByLabelText('Surname') as HTMLInputElement;

  fireEvent.change(input, { target: { value: 'x' } });
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(chips()).toEqual(['Remove A', 'Remove B']);

  fireEvent.change(input, { target: { value: '' } });
  fireEvent.keyDown(input, { key: 'Backspace' });
  fireEvent.keyDown(input, { key: 'Backspace' });
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  fireEvent.keyDown(input, { key: 'a' });
});

it('shows the values it is given and only reports changes', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <TokenField label='Surname' onChange={onChange} values={['A', 'B']} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Remove A' }));
  expect(onChange).toHaveBeenCalledWith(['B']);
  expect(chips()).toEqual(['Remove A', 'Remove B']);

  rerender(<TokenField label='Surname' onChange={onChange} values={[]} />);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});

it('disables the input and the ×, and shows a state and placeholder', () => {
  render(
    <TokenField
      defaultValues={['A']}
      disabled
      label='Surname'
      placeholder='Add a surname'
      state='focus'
    />
  );

  expect((screen.getByLabelText('Surname') as HTMLInputElement).disabled).toBe(
    true
  );
  expect(
    (screen.getByRole('button', { name: 'Remove A' }) as HTMLButtonElement)
      .disabled
  ).toBe(true);
  expect(screen.getByPlaceholderText('Add a surname')).toBeTruthy();
  expect(screen.getByRole('group').dataset.state).toBe('focus');
});
