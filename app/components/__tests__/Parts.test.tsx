import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Chip, RemovableChip } from '../Chip';
import { Divider } from '../Divider';
import { EVENT_GLYPHS, EventGlyph } from '../EventGlyph';
import { KeyHint } from '../KeyHint';

// NFR-06
it('draws a hairline separator, or one with a word between two lines', () => {
  render(
    <>
      <Divider />
      <Divider label='or' />
    </>
  );

  expect(screen.getByRole('separator')).toBeTruthy();
  expect(screen.getByText('or').getAttribute('aria-hidden')).toBeNull();
});

it('draws a key hint as a kbd, hidden from assistive tech only when decorative', () => {
  const { container } = render(
    <>
      <KeyHint>Shift</KeyHint>
      <KeyHint decorative>/</KeyHint>
    </>
  );

  const [shift, slash] = Array.from(container.querySelectorAll('kbd'));

  expect(shift.textContent).toBe('Shift');
  expect(shift.getAttribute('aria-hidden')).toBeNull();
  expect(slash.getAttribute('aria-hidden')).toBe('true');
});

it.each(Object.entries(EVENT_GLYPHS))(
  'draws the %s glyph in text form, hidden from assistive tech',
  (event, glyph) => {
    const { container } = render(
      <EventGlyph event={event as keyof typeof EVENT_GLYPHS} size={16} />
    );

    const span = container.querySelector('span')!;

    expect(span.textContent).toBe(`${glyph}︎`);
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.style.fontSize).toBe('16px');
  }
);

it('sizes a glyph 14 unless told', () => {
  const { container } = render(<EventGlyph event='birth' />);

  expect(container.querySelector('span')!.style.fontSize).toBe('14px');
});

it('leads a chip with its glyph, and names it by its label', () => {
  render(
    <Chip glyph='death' on>
      Death
    </Chip>
  );

  const chip = screen.getByRole('button', { name: 'Death' });

  expect(chip.querySelector('[data-event="death"]')).toBeTruthy();
});

it('removes a chip with a × named for it', () => {
  let removed = 0;

  render(
    <RemovableChip
      onRemove={() => (removed += 1)}
      state='hover'
      value='Rossouw'
    />
  );

  const remove = screen.getByRole('button', { name: 'Remove Rossouw' });

  remove.click();
  expect(removed).toBe(1);
  expect(remove.dataset.state).toBe('hover');
});

it('draws a removable chip without a handler', () => {
  render(<RemovableChip value='Rossouw' />);

  screen.getByRole('button', { name: 'Remove Rossouw' }).click();
});
