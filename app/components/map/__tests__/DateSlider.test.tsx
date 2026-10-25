import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { DateSlider } from '@/app/components/map/DateSlider';
import { toDay } from '@/lib/boundaries/model.mts';

const today = toDay('2026-10-21');

const setup = (
  props: Partial<Parameters<typeof DateSlider>[0]> = {},
  day = toDay('1902-01-01')
) => {
  const onChange = vi.fn();
  const { container } = render(
    <DateSlider
      day={day}
      lastDay={today}
      onChange={onChange}
      precision='year'
      {...props}
    />
  );

  return { container, onChange };
};

const f = (element: Element) =>
  Number((element as HTMLElement).style.getPropertyValue('--f'));

// MAP-08
it('draws a tick at each epoch, as the thumb would sit', () => {
  const { container } = setup({ ticks: [1652, 1902] });
  const ticks = [...container.querySelectorAll('[data-year]')];

  expect(ticks.map(tick => tick.getAttribute('data-year'))).toEqual([
    '1652',
    '1902',
  ]);
  expect(f(ticks[0])).toBe(0);
  expect(f(ticks[1])).toBeCloseTo((1902 - 1652) / (2026 - 1652));
});

it('draws a hatched span over the contested years', () => {
  const { container } = setup({ contested: [{ from: 1900, to: 1902 }] });
  const span = container.querySelector('[data-from="1900"]') as HTMLElement;

  expect(span.getAttribute('data-to')).toBe('1902');
  expect(f(span)).toBeCloseTo((1900 - 1652) / (2026 - 1652));
  expect(Number(span.style.getPropertyValue('--g'))).toBeCloseTo(
    (1903 - 1652) / (2026 - 1652)
  );
});

it('labels 1652, every 50th year and Today, but not a year at the end', () => {
  const { container } = setup();
  const text = [...container.querySelectorAll('span > span')].map(
    span => span.textContent
  );

  expect(text).toEqual([
    '1652',
    '1700',
    '1750',
    '1800',
    '1850',
    '1900',
    '1950',
    '2000',
    'Today',
  ]);
});

it('drops a year label that would touch Today', () => {
  const { container } = setup({ lastDay: toDay('2001-01-01') });

  expect(container.textContent).not.toContain('2000');
});

it('places the marks at month precision', () => {
  const { container } = setup({ precision: 'month', ticks: [1652] });

  expect(f(container.querySelector('[data-year]')!)).toBe(0);
});

it('moves ten steps with Shift and an arrow', () => {
  const { onChange } = setup({}, toDay('1902-05-06'));
  const slider = screen.getByRole('slider', { name: 'Map date' });

  fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });
  expect(onChange).toHaveBeenLastCalledWith(toDay('1912-05-06'));
  fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
  expect(onChange).toHaveBeenLastCalledWith(toDay('1892-05-06'));
});

it('stops Shift and an arrow at both ends', () => {
  const first = setup({}, 0);

  fireEvent.keyDown(screen.getByRole('slider'), {
    key: 'ArrowLeft',
    shiftKey: true,
  });
  expect(first.onChange).toHaveBeenLastCalledWith(0);
});

it('leaves a plain arrow and other keys to the range', () => {
  const { onChange } = setup();
  const slider = screen.getByRole('slider');

  fireEvent.keyDown(slider, { key: 'ArrowRight' });
  fireEvent.keyDown(slider, { key: 'a', shiftKey: true });
  expect(onChange).not.toHaveBeenCalled();
});
