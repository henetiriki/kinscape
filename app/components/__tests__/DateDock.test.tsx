import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { fromDay, toDay } from '@/lib/boundaries/model.mts';

import { DateDock } from '../DateDock';

const today = toDay('2026-10-21');

const setup = (day: number) => {
  const onChange = vi.fn();

  render(<DateDock day={day} lastDay={today} onChange={onChange} />);

  return onChange;
};

const lastDate = (onChange: ReturnType<typeof vi.fn>) =>
  fromDay(onChange.mock.calls.at(-1)?.[0]);

// MAP-03
it('shows the date at Year precision, read-only', () => {
  setup(today);

  const field = screen.getByRole('textbox', {
    name: 'Date shown',
  }) as HTMLInputElement;

  expect(field.value).toBe('2026');
  expect(field.readOnly).toBe(true);
});

it('shows the date at Month and Day precision', () => {
  setup(today);
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
  expect(
    (screen.getByRole('textbox', { name: 'Date shown' }) as HTMLInputElement)
      .value
  ).toBe('2026-10');
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  expect(
    (screen.getByRole('textbox', { name: 'Date shown' }) as HTMLInputElement)
      .value
  ).toBe('2026-10-21');
  expect(
    (screen.getByRole('radio', { name: 'Day' }) as HTMLInputElement).checked
  ).toBe(true);
});

it('steps forward and back by the precision', () => {
  const onChange = setup(toDay('2020-03-15'));

  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  expect(lastDate(onChange)).toBe('2021-03-15');
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  expect(lastDate(onChange)).toBe('2020-04-15');
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(lastDate(onChange)).toBe('2020-03-14');
});

it('disables Forward on the last date', () => {
  setup(today);
  expect(
    (screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement)
      .disabled
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled
  ).toBe(false);
});

it('disables Back on 1652-01-01', () => {
  setup(0);
  expect(
    (screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement)
      .disabled
  ).toBe(false);
});

it('moves the Map date from the slider', () => {
  const onChange = setup(today);

  fireEvent.change(screen.getByRole('slider', { name: 'Map date' }), {
    target: { value: '148' },
  });
  expect(lastDate(onChange)).toBe('1800-10-21');
});
