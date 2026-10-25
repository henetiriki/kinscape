import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { DateDock } from '@/app/components/map/DateDock';
import { fromDay, toDay } from '@/lib/boundaries/model.mts';

const today = toDay('2026-10-21');

const setup = (day: number) => {
  const onChange = vi.fn();

  render(<DateDock day={day} lastDay={today} onChange={onChange} />);

  return onChange;
};

const lastDate = (onChange: ReturnType<typeof vi.fn>) =>
  fromDay(onChange.mock.calls.at(-1)?.[0]);

const field = () =>
  screen.getByRole('textbox', { name: 'Date shown' }) as HTMLInputElement;

// MAP-03
it('shows the date at Year precision in a DateField', () => {
  setup(today);
  expect(field().value).toBe('2026');
});

it('shows the date at Month and Day precision', () => {
  setup(today);
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
  expect(field().value).toBe('2026-10');
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  expect(field().value).toBe('2026-10-21');
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

it('goes to a typed date and takes its precision', () => {
  const onChange = setup(today);

  fireEvent.change(field(), { target: { value: '1901-05' } });
  fireEvent.keyDown(field(), { key: 'Enter' });
  expect(lastDate(onChange)).toBe('1901-05-01');
  expect(
    (screen.getByRole('radio', { name: 'Month' }) as HTMLInputElement).checked
  ).toBe(true);
});

it('shows a bad typed date as a message above the field', () => {
  const onChange = setup(today);

  fireEvent.change(field(), { target: { value: '1500' } });
  fireEvent.keyDown(field(), { key: 'Enter' });
  expect(screen.getByText(/The map still shows 2026/)).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

it('shows the key hints at the precision', () => {
  setup(today);
  fireEvent.click(screen.getByRole('radio', { name: 'Day' }));
  expect(screen.getByText(/1 day · with/)).toBeTruthy();
});

it('has no Play, Jump to or contested note unless they are passed', () => {
  setup(today);
  expect(
    screen.queryByRole('button', { name: 'Play through time' })
  ).toBeNull();
  expect(screen.queryByText('Jump to')).toBeNull();
  expect(screen.queryByText(/contested/)).toBeNull();
});

const full = (onPlay = vi.fn(), onChange = vi.fn()) => {
  render(
    <DateDock
      contestedCount={2}
      contestedYears={[{ from: 1900, to: 1902 }]}
      day={toDay('1902-03-04')}
      epochs={[{ year: 1652 }, { year: 1902 }]}
      lastDay={today}
      onChange={onChange}
      onPlay={onPlay}
    />
  );

  return { onChange, onPlay };
};

// MAP-08, MAP-09
it('reaches Play and each speed by keyboard, with a checked speed', () => {
  const { onPlay } = full();

  expect(screen.getByText('2 contested claims on this date')).toBeTruthy();

  const play = screen.getByRole('button', { name: 'Play through time' });

  play.focus();
  expect(document.activeElement).toBe(play);
  screen.getByRole('radio', { name: '1' }).focus();
  expect(document.activeElement).toBe(screen.getByRole('radio', { name: '1' }));
  fireEvent.click(play);
  expect(onPlay).toHaveBeenLastCalledWith(5);

  fireEvent.click(screen.getByRole('radio', { name: '10' }));
  expect(
    (screen.getByRole('radio', { name: '10' }) as HTMLInputElement).checked
  ).toBe(true);
  fireEvent.click(play);
  expect(onPlay).toHaveBeenLastCalledWith(10);
  expect(
    screen.getByRole('radiogroup', { name: /Playback speed/ })
  ).toBeTruthy();
});

it('jumps to an epoch, within the last date', () => {
  const { onChange } = full();

  expect(
    screen.getByRole('button', { name: '1902' }).getAttribute('aria-current')
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: '1652' }));
  expect(lastDate(onChange)).toBe('1652-01-01');
});

it('keeps a jump past today on today', () => {
  const onChange = vi.fn();

  render(
    <DateDock
      day={today}
      epochs={[{ year: 2026 }]}
      lastDay={toDay('2026-01-01') - 1}
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '2026' }));
  expect(lastDate(onChange)).toBe('2025-12-31');
});

const sheet = (expanded: boolean, onPlay?: () => void) => {
  const onExpandedChange = vi.fn();

  render(
    <DateDock
      day={today}
      lastDay={today}
      onChange={vi.fn()}
      onPlay={onPlay}
      sheet={{ expanded, onExpandedChange }}
    />
  );

  return onExpandedChange;
};

it('shows the phone sheet collapsed without slider, precision, speed, Jump to or hints', () => {
  const onPlay = vi.fn();
  const onExpandedChange = sheet(false, onPlay);

  expect(screen.getByRole('region', { name: 'Map date' })).toBeTruthy();
  expect(field().value).toBe('2026');
  fireEvent.click(screen.getByRole('button', { name: 'Play through time' }));
  expect(onPlay).toHaveBeenCalledWith(5);
  expect(screen.queryByRole('slider')).toBeNull();
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(screen.queryByText('Jump to')).toBeNull();
  expect(screen.queryByText(/with/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Expand the sheet' }));
  expect(onExpandedChange).toHaveBeenCalledWith(true);
});

it('draws the slider in the expanded phone sheet', () => {
  sheet(true);
  expect(screen.getByRole('slider', { name: 'Map date' })).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Play through time' })
  ).toBeNull();
});
