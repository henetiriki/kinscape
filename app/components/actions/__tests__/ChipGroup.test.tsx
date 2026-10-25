import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { ChipGroup } from '@/app/components/actions/ChipGroup';
import { EVENT_GLYPHS, type EventType } from '@/app/components/map/EventGlyph';

const OPTIONS = (Object.keys(EVENT_GLYPHS) as EventType[]).map(glyph => ({
  glyph,
  label: glyph[0].toUpperCase() + glyph.slice(1),
  value: glyph,
}));

// EXP-03
it('is a group of nine toggle chips, each with its glyph and aria-pressed', () => {
  const onToggle = vi.fn();

  render(
    <ChipGroup
      label='Event type'
      onToggle={onToggle}
      options={OPTIONS}
      selected={['birth']}
    />
  );
  expect(screen.getByRole('group', { name: 'Event type' })).toBeTruthy();

  const chips = screen.getAllByRole('button');

  expect(chips).toHaveLength(9);
  expect(chips.map(chip => chip.getAttribute('aria-pressed'))).toEqual(
    OPTIONS.map(({ value }) => String(value === 'birth'))
  );
  expect(chips.every(chip => chip.querySelector('[data-event]'))).toBe(true);
  expect(chips.every(chip => chip.tagName === 'BUTTON')).toBe(true);

  // A native button: Space and Enter click it.
  fireEvent.click(screen.getByRole('button', { name: /Marriage/ }));
  expect(onToggle).toHaveBeenCalledWith('marriage');
});

it('draws a chip without a glyph', () => {
  render(
    <ChipGroup
      label='Kind'
      onToggle={vi.fn()}
      options={[{ label: 'Any', value: 'any' }]}
      selected={[]}
    />
  );
  expect(screen.getByRole('button', { name: 'Any' })).toBeTruthy();
});
