import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AddPinPanel } from '@ks/app/screens/add-pin/AddPinPanel';
import { EVENT_ORDER } from '@ks/lib/ui/EventGlyph';

const region = () => screen.getByRole('region', { name: 'Add a pin' });

const chip = (name: string) => screen.getByRole('button', { name });

describe('on a desktop', () => {
  it('is a titled panel with the Person, Place and Address fields, filled with sample data', () => {
    render(<AddPinPanel />);

    expect(region().getAttribute('data-form')).toBe('desktop');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Add a pin' })
    ).toBeTruthy();
    expect(
      (screen.getByRole('textbox', { name: 'Person' }) as HTMLInputElement)
        .value
    ).toBe('Example Person');
    expect(screen.getByText('Search the Tree')).toBeTruthy();
    expect(
      (screen.getByRole('searchbox', { name: 'Place' }) as HTMLInputElement)
        .value
    ).toBe('Example Farm');
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Address as recorded',
        }) as HTMLInputElement
      ).value
    ).toBe('Farm Example, district Example');
  });

  // PIN-03
  it('lists every Event type, with Residence on, and each chip toggles', () => {
    render(<AddPinPanel />);

    expect(
      screen
        .getAllByRole('button')
        .filter(button => button.hasAttribute('aria-pressed'))
        .map(button => button.textContent)
    ).toEqual(
      EVENT_ORDER.map(event => `${event[0].toUpperCase()}${event.slice(1)}`)
    );
    expect(chip('Residence').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Birth').getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(chip('Birth'));
    expect(chip('Birth').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(chip('Residence'));
    expect(chip('Residence').getAttribute('aria-pressed')).toBe('false');
    expect(chip('Birth').getAttribute('aria-pressed')).toBe('true');
  });

  // MAP-03
  it('starts the From date on a date that does not exist, with its error below', () => {
    render(<AddPinPanel />);

    const date = screen.getByRole('textbox', { name: 'Date shown' });

    expect((date as HTMLInputElement).value).toBe('1901-02-30');
    expect(date.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe(
      'February 1901 has 28 days.'
    );
    expect(screen.getByRole('group', { name: 'From' }).contains(date)).toBe(
      true
    );
  });

  it('clears the error when a good date is typed', () => {
    render(<AddPinPanel />);

    const date = screen.getByRole('textbox', { name: 'Date shown' });

    fireEvent.change(date, { target: { value: '1902-03-01' } });
    fireEvent.blur(date);

    expect(date.getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // PIN-08
  it('warns that the pin overlaps another residence, without blocking', () => {
    render(<AddPinPanel />);

    const alert = screen.getByRole('status');

    expect(alert.textContent).toContain('Overlaps another residence');
    expect(alert.textContent).toContain(
      'Example Person already lives at Example Farm from 1840 to 1855.'
    );
    expect(
      screen.getByRole('button', { name: 'Save pin' }).hasAttribute('disabled')
    ).toBe(false);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });
});

describe('on a phone', () => {
  const desktop = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = desktop;
  });

  // NFR-05
  it('is the sheet form, with the date field filling its row', () => {
    const { container } = render(<AddPinPanel />);

    expect(region().getAttribute('data-form')).toBe('phone');
    expect(container.querySelector('[data-fill]')).not.toBeNull();
  });
});
