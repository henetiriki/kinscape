import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  expect(
    screen
      .getByRole('button', { name: 'Back' })
      .parentElement!.contains(
        screen.getByRole('button', { name: 'Play through time' })
      )
  ).toBe(true);
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

const typeDate = (text: string) => {
  fireEvent.change(field(), { target: { value: text } });
  fireEvent.keyDown(field(), { key: 'Enter' });
};

// MAP-03
it('keeps the phone sheet on Year and shows no precision note', () => {
  const onChange = vi.fn();

  render(
    <DateDock
      day={toDay('1901-01-01')}
      lastDay={today}
      onChange={onChange}
      sheet={{ expanded: false, onExpandedChange: vi.fn() }}
    />
  );
  typeDate('1901-06');
  expect(lastDate(onChange)).toBe('1901-06-01');
  expect(field().value).toBe('1901');
  expect(screen.queryByRole('status')).toBeNull();
});

const month = () => screen.getByRole('radio', { name: 'Month' });

it('keeps Month when less detail is typed, even on the date it shows', () => {
  const onChange = setup(toDay('1901-01-01'));

  fireEvent.click(month());
  typeDate('1901');
  expect(field().value).toBe('1901-01');
  expect((month() as HTMLInputElement).checked).toBe(true);
  expect(onChange).not.toHaveBeenCalled();

  typeDate('1905');
  expect(lastDate(onChange)).toBe('1905-01-01');
  expect(field().value).toBe('1905-01');
  expect(screen.queryByRole('status')).toBeNull();
});

it('goes to the first day of a typed year or month at Year precision', () => {
  const onChange = setup(today);

  typeDate('1901');
  expect(lastDate(onChange)).toBe('1901-01-01');
  typeDate('1901-06');
  expect(lastDate(onChange)).toBe('1901-06-01');
});

it('says each bad date once and leaves the Map date alone', () => {
  const onChange = setup(today);

  for (const [text, message] of [
    ['1651-12-31', 'Dates run from 1652 to today.'],
    ['abc', 'Use 1901, 1901-06 or 1901-06-14.'],
    ['14/06/1901', 'Use 1901, 1901-06 or 1901-06-14.'],
    ['2026-12', "That's after today."],
  ]) {
    typeDate(text);
    expect(screen.getByText(message)).toBeTruthy();
    expect(field().value).toBe(text);
  }

  expect(onChange).not.toHaveBeenCalled();
});

const Host = () => {
  const [day, setDay] = useState(toDay('2020-03-15'));

  return <DateDock day={day} lastDay={today} onChange={setDay} />;
};

it('clears the error on Esc and the slider', () => {
  render(<Host />);

  typeDate('abc');
  expect(screen.getByText(/The map still shows/)).toBeTruthy();
  fireEvent.keyDown(field(), { key: 'Escape' });
  expect(screen.queryByText(/The map still shows/)).toBeNull();
  expect(field().value).toBe('2020');

  typeDate('abc');
  fireEvent.change(screen.getByRole('slider', { name: 'Map date' }), {
    target: { value: '10' },
  });
  expect(screen.queryByText(/The map still shows/)).toBeNull();
});

it('clears the error when a step button moves the date', () => {
  render(<Host />);
  typeDate('abc');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.queryByText(/The map still shows/)).toBeNull();
  expect(field().value).toBe('2019');
});

describe('the precision note', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows for 4 seconds when typing switches to a finer precision', () => {
    setup(today);
    typeDate('1901-06');

    expect(screen.getByRole('status').textContent).toBe(
      'Switched to month precision.'
    );
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('restarts the timer on a new switch', () => {
    setup(today);
    typeDate('1901-06');
    act(() => vi.advanceTimersByTime(3000));
    typeDate('1901-06-14');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status').textContent).toBe(
      'Switched to day precision.'
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('also shows after a fix to a finer precision', () => {
    setup(today);
    typeDate('2031');
    fireEvent.click(screen.getByRole('button', { name: 'Go to today' }));
    expect(screen.getByRole('status').textContent).toBe(
      'Switched to day precision.'
    );
  });
});

describe('the no-borders warning', () => {
  const hasBorders = (day: number) => day >= toDay('1910-05-31');
  const text = 'No borders are mapped for 1750 yet.';

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // MAP-03
  const Bordered = () => {
    const [day, setDay] = useState(today);

    return (
      <>
        <p data-testid='day'>{fromDay(day)}</p>
        <DateDock
          day={day}
          hasBorders={hasBorders}
          lastDay={today}
          onChange={setDay}
        />
      </>
    );
  };

  it('shows as a warning, not an error, and moves the Map date', () => {
    render(<Bordered />);
    typeDate('1750');
    expect(screen.getByTestId('day').textContent).toBe('1750-01-01');
    expect(screen.getByRole('status').textContent).toBe(text);
    expect(field().getAttribute('aria-invalid')).not.toBe('true');
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('replaces the precision note and shows nothing for a date with borders', () => {
    render(<Bordered />);
    typeDate('1750-06');
    expect(screen.getByRole('status').textContent).toBe(text);
    typeDate('2000-06-01');
    expect(screen.getByRole('status').textContent).toBe(
      'Switched to day precision.'
    );
  });

  it('is dropped when the Map date moves on', () => {
    render(<Bordered />);
    typeDate('1750');
    expect(screen.getByRole('status').textContent).toBe(text);
    fireEvent.change(screen.getByRole('slider', { name: 'Map date' }), {
      target: { value: '248' },
    });
    expect(screen.getByTestId('day').textContent).toBe('1900-01-01');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
