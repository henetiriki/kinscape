import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { DateField } from '@ks/app/components/forms/DateField';
import { toDay } from '@ks/lib/boundaries/model.mts';
import { MIN_DAY } from '@ks/lib/map/map-date';

const TODAY = toDay('2026-10-21');
const JUNE = toDay('1901-06-14');

const setup = (props: Partial<Parameters<typeof DateField>[0]> = {}) => {
  const onChange = vi.fn();

  render(
    <DateField
      day={JUNE}
      max={TODAY}
      min={MIN_DAY}
      onChange={onChange}
      precision='day'
      {...props}
    />
  );

  return {
    field: screen.getByRole('textbox', {
      name: 'Date shown',
    }) as HTMLInputElement,
    onChange,
  };
};

const type = (field: HTMLInputElement, text: string) =>
  fireEvent.change(field, { target: { value: text } });

// MAP-03
it('shows the date and does not check while typing', () => {
  const { field, onChange } = setup();

  expect(field.value).toBe('1901-06-14');
  type(field, '1901-02-3');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

it('keeps 1901-02-30, shows why, and offers the last day', () => {
  const { field, onChange } = setup();

  type(field, '1901-02-30');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(field.value).toBe('1901-02-30');
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('alert').textContent).toBe(
    'February 1901 has 28 days.'
  );
  expect(field.getAttribute('aria-describedby')).toBe(
    screen.getByRole('alert').id
  );
  expect(onChange).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Go to 1901-02-28' }));

  expect(onChange).toHaveBeenCalledWith(toDay('1901-02-28'), 'day');
  expect(field.value).toBe('1901-02-28');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('says the formats it accepts for 14/06/1901, with no fix', () => {
  const { field } = setup();

  type(field, '14/06/1901');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(screen.getByRole('alert').textContent).toBe(
    'Use 1901, 1901-06 or 1901-06-14.'
  );
  expect(screen.queryByRole('button')).toBeNull();
});

it('offers 1652 for 1650 and today for a later date', () => {
  const { field, onChange } = setup();

  type(field, '1650');
  fireEvent.keyDown(field, { key: 'Enter' });
  expect(screen.getByRole('alert').textContent).toBe(
    'Dates run from 1652 to today.'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Go to 1652' }));
  expect(onChange).toHaveBeenLastCalledWith(MIN_DAY, 'year');

  type(field, '2031');
  fireEvent.blur(field);
  expect(screen.getByRole('alert').textContent).toBe("That's after today.");
  fireEvent.click(screen.getByRole('button', { name: 'Go to today' }));
  expect(onChange).toHaveBeenLastCalledWith(TODAY, 'day');
});

it('accepts 1901-6-4 as 1901-06-04', () => {
  const { field, onChange } = setup();

  type(field, '1901-6-4');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(onChange).toHaveBeenCalledWith(toDay('1901-06-04'), 'day');
  expect(field.value).toBe('1901-06-04');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('checks when focus leaves, and not again if nothing changed', () => {
  const { field, onChange } = setup();

  fireEvent.blur(field);
  expect(onChange).not.toHaveBeenCalled();

  type(field, '1901');
  fireEvent.blur(field);
  expect(onChange).toHaveBeenCalledWith(toDay('1901-01-01'), 'day');
});

it('keeps a finer precision when less detail is typed', () => {
  const { field, onChange } = setup({ day: toDay('1901-01-01') });

  type(field, '1901');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(onChange).not.toHaveBeenCalled();
  expect(field.value).toBe('1901-01-01');
});

it('takes the typed precision when it is finer', () => {
  const { field, onChange } = setup({ precision: 'year' });

  type(field, '1901-06');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(onChange).toHaveBeenCalledWith(toDay('1901-06-01'), 'month');
});

it('does not report a date it already shows', () => {
  const { field, onChange } = setup();

  type(field, '1901-6-14');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(onChange).not.toHaveBeenCalled();
  expect(field.value).toBe('1901-06-14');
});

it('puts the last good date back on Esc and clears the error', () => {
  const { field, onChange } = setup();

  type(field, '1901-02-30');
  fireEvent.keyDown(field, { key: 'Enter' });
  fireEvent.keyDown(field, { key: 'Escape' });

  expect(field.value).toBe('1901-06-14');
  expect(field.getAttribute('aria-invalid')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();

  fireEvent.keyDown(field, { key: 'a' });
  expect(field.value).toBe('1901-06-14');
});

// B280, MAP-03, NFR-06
const typeBad = (field: HTMLInputElement) => {
  type(field, '1901-02-30');
  fireEvent.blur(field);
};

it('puts the last good date back on Esc after focus has left the field', () => {
  const { field, onChange } = setup();

  typeBad(field);
  expect(field.getAttribute('aria-invalid')).toBe('true');
  fireEvent.keyDown(document.body, { key: 'Escape' });

  expect(field.value).toBe('1901-06-14');
  expect(field.getAttribute('aria-invalid')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

it('stops listening for Esc once the problem is gone', () => {
  const { field } = setup();

  typeBad(field);
  fireEvent.keyDown(document.body, { key: 'Escape' });
  type(field, '1901-02-31');
  fireEvent.keyDown(document.body, { key: 'Escape' });

  expect(field.value).toBe('1901-02-31');
});

it('leaves an Esc another control took or is inside', () => {
  const { field } = setup();

  typeBad(field);

  const taken = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  });

  taken.preventDefault();
  document.body.dispatchEvent(taken);

  const dialog = document.createElement('dialog');
  const other = document.createElement('input');

  dialog.append(other);
  document.body.append(dialog);
  fireEvent.keyDown(other, { key: 'Escape' });
  dialog.remove();

  const role = document.createElement('div');

  role.setAttribute('role', 'dialog');
  document.body.append(role);
  fireEvent.keyDown(role, { key: 'Escape' });
  role.remove();

  const search = document.createElement('input');

  document.body.append(search);
  fireEvent.keyDown(search, { key: 'Escape' });
  search.remove();

  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(field.value).toBe('1901-02-30');
});

it('answers an Esc from a checkbox, radio or slider', () => {
  const { field } = setup();

  typeBad(field);

  const radio = document.createElement('input');

  radio.type = 'radio';
  document.body.append(radio);
  fireEvent.keyDown(radio, { key: 'Escape' });
  radio.remove();

  expect(field.getAttribute('aria-invalid')).toBeNull();
});

it('ignores other keys after focus has left the field', () => {
  const { field } = setup();

  typeBad(field);
  fireEvent.keyDown(document.body, { key: 'a' });

  expect(field.getAttribute('aria-invalid')).toBe('true');
});

it('does not listen for Esc on a problem from defaultText', () => {
  const { field } = setup({ defaultText: '1901-02-30' });

  expect(field.getAttribute('aria-invalid')).toBe('true');
  fireEvent.keyDown(document.body, { key: 'Escape' });

  expect(field.value).toBe('1901-02-30');
});

it('drops a problem when the date changes from outside', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <DateField
      day={JUNE}
      max={TODAY}
      min={MIN_DAY}
      onChange={onChange}
      precision='day'
    />
  );
  const field = screen.getByRole('textbox') as HTMLInputElement;

  type(field, '1901-02-30');
  fireEvent.keyDown(field, { key: 'Enter' });
  rerender(
    <DateField
      day={JUNE + 1}
      max={TODAY}
      min={MIN_DAY}
      onChange={onChange}
      precision='day'
    />
  );

  expect(field.value).toBe('1901-06-15');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('checks its starting text on the first render, unless it is being typed', () => {
  setup({ defaultText: '2031' });
  expect(screen.getByRole('alert').textContent).toBe("That's after today.");
});

it('leaves a half-typed date unchecked', () => {
  const { field } = setup({ defaultText: '1901-0', state: 'focus' });

  expect(field.value).toBe('1901-0');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('starts with the date when its starting text is a good date', () => {
  const { field } = setup({ defaultText: '1901-06' });

  expect(field.value).toBe('1901-06');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('opens the message above the field, naming the date the map shows, with the Esc hint and, for a phone, the fix', () => {
  setup({
    day: toDay('1901-02-28'),
    defaultText: '1901-02-30',
    placement: 'above',
  });

  expect(screen.getByRole('alert').textContent).toBe(
    'February 1901 has 28 days. The map still shows 1901-02-28. Press Esc to go back to it.Go to 1901-02-28'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Go to 1901-02-28' }));
  expect(screen.queryByRole('alert')).toBeNull();
});

it('opens a message above the field with no fix when the date has none', () => {
  setup({ defaultText: '14/06/1901', placement: 'above' });

  expect(screen.getByRole('alert').textContent).toMatch(/Press Esc/);
  expect(screen.queryByRole('button')).toBeNull();
});

it('takes the width of its row when asked to fill it', () => {
  const { field } = setup({ fill: true });

  expect(field.closest('[data-fill]')).toBeTruthy();
});

it('keeps its own width unless asked to fill the row', () => {
  const { field } = setup();

  expect(field.closest('[data-fill]')).toBeNull();
});

it('shows a notice while it is passed, as a status', () => {
  setup({ notice: { text: 'Switched to month precision.', tone: 'info' } });

  const notice = screen.getByRole('status');

  expect(notice.textContent).toBe('Switched to month precision.');
  expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe(
    notice.id
  );
  expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBeNull();
});

// MAP-03
it('commits a typed date at its own precision with keepPrecision', () => {
  const { field, onChange } = setup({
    day: toDay('1901-01-01'),
    keepPrecision: true,
    precision: 'year',
  });

  type(field, '1901-06');
  fireEvent.keyDown(field, { key: 'Enter' });

  expect(onChange).toHaveBeenCalledWith(toDay('1901-06-01'), 'year');
  expect(field.value).toBe('1901');
});

it('applies a fix at its own precision with keepPrecision', () => {
  const { field, onChange } = setup({
    keepPrecision: true,
    placement: 'above',
    precision: 'year',
  });

  type(field, '1901-02-30');
  fireEvent.keyDown(field, { key: 'Enter' });
  fireEvent.click(screen.getByRole('button', { name: 'Go to 1901-02-28' }));

  expect(onChange).toHaveBeenCalledWith(toDay('1901-02-28'), 'year');
  expect(field.value).toBe('1901');
});

it('marks a warning without blocking', () => {
  const { field } = setup({
    notice: { text: 'No borders are mapped for 1750 yet.', tone: 'warning' },
  });

  expect(field.getAttribute('aria-invalid')).toBeNull();
  expect(field.closest('[data-mark]')?.getAttribute('data-mark')).toBe(
    'warning'
  );
});
