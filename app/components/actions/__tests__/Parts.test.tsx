import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Chip, RemovableChip } from '@ks/app/components/actions/Chip';
import { KeyHint } from '@ks/app/components/actions/KeyHint';

// NFR-06
it('draws a key hint as a kbd, hidden from assistive tech only when decorative', () => {
  render(
    <>
      <KeyHint>Shift</KeyHint>
      <KeyHint decorative>/</KeyHint>
    </>
  );

  const shift = screen.getByText('Shift', { selector: 'kbd' });
  const slash = screen.getByText('/', { selector: 'kbd' });

  expect(shift.textContent).toBe('Shift');
  expect(shift.getAttribute('aria-hidden')).toBeNull();
  expect(slash.getAttribute('aria-hidden')).toBe('true');
});

it('leads a chip with its glyph, and names it by its label', () => {
  render(
    <Chip glyph='death' on>
      Death
    </Chip>
  );

  const chip = screen.getByRole('button', { name: 'Death' });

  expect(chip.firstElementChild?.getAttribute('data-event')).toBe('death');
  expect(chip.textContent).toBe('Death');
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

  fireEvent.click(screen.getByRole('button', { name: 'Remove Rossouw' }));
});
