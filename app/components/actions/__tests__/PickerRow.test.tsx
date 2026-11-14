import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PickerRow } from '@ks/app/components/actions/PickerRow';

const css = readFileSync(
  join(process.cwd(), 'app/components/actions/PickerRow.module.css'),
  'utf8'
);

const row = (props: Partial<Parameters<typeof PickerRow>[0]> = {}) =>
  render(
    <PickerRow
      born='1832'
      bornReading='In 1832'
      died='1899'
      diedReading='In 1899'
      givenNames='Hendrik Willem'
      surname='Botha'
      {...props}
    />
  );

// PPL-02
describe('a picker row', () => {
  it('is one button with the name, the line and the words for the dates', () => {
    row();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
    expect(screen.getByRole('button').textContent).toBe(
      'Botha, Hendrik WillemBorn in 1832, died in 18991832 – 1899'
    );
    expect(screen.getByText('1832 – 1899').getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(screen.queryByText(/née|Matches/)).toBeNull();
  });

  it('shows "née" alone, the matched spelling alone, or both', () => {
    const first = row({ maidenName: 'Fourie' });

    expect(screen.getByText('née Fourie')).toBeInstanceOf(HTMLSpanElement);
    first.unmount();

    const second = row({ matchedVariant: 'Bota' });

    expect(screen.getByText('Matches the spelling “Bota”')).toBeInstanceOf(
      HTMLSpanElement
    );
    second.unmount();
    row({ maidenName: 'Fourie', matchedVariant: 'Bota' });
    expect(screen.getByText(/^née Fourie/).textContent).toBe(
      'née Fourie · Matches the spelling “Bota”'
    );
  });

  it('shows the line for a Person with no dates', () => {
    row({ born: '', bornReading: '', died: '', diedReading: '' });
    expect(screen.getByText('? –')).toBeInstanceOf(HTMLSpanElement);
    expect(screen.getByText('Born unknown').className).toMatch(/hidden/);
  });

  it('passes a click and a state to the button', () => {
    let clicked = 0;

    row({ onClick: () => (clicked += 1), state: 'active' });
    screen.getByRole('button').click();
    expect(clicked).toBe(1);
    expect(screen.getByRole('button').dataset.state).toBe('active');
  });

  it('has the hover, pressed and focus states of the Person row', () => {
    expect(css).toContain('min-height: var(--size-row-l)');
    expect(css).toMatch(/hover[\s\S]*?background: var\(--surface-2\)/);
    expect(css).toMatch(/active[\s\S]*?background: var\(--segment\)/);
    expect(css).toContain(
      "composes: ring from '@ks/app/components/foundation/focus.module.css'"
    );
    expect(/\.row \{[^}]*\}/.exec(css)![0]).toContain('position: relative');
  });
});
