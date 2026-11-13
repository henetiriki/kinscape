// PIN-04
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { FuzzyDateField } from '@ks/features/people/components/FuzzyDateField';

const css = readFileSync(
  join(process.cwd(), 'features/people/components/FuzzyDateField.module.css'),
  'utf8'
);

const HELPER = 'For example 1850, ABT 1850 or BET 1850 AND 1855.';

const setup = (props: Partial<Parameters<typeof FuzzyDateField>[0]> = {}) => {
  render(<FuzzyDateField helper={HELPER} label='Born' {...props} />);

  return screen.getByRole('textbox', { name: 'Born' }) as HTMLInputElement;
};

const type = (field: HTMLInputElement, text: string) =>
  fireEvent.change(field, { target: { value: text } });

const slot = () => document.querySelector('[aria-live="polite"]')!;

it('shows the helper when empty, and an empty check is no error', () => {
  const field = setup();

  expect(slot().textContent).toBe(HELPER);
  fireEvent.blur(field);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(slot().textContent).toBe(HELPER);
  expect(field.getAttribute('aria-invalid')).toBeNull();
});

it('keeps the helper and shows no error while the date is not readable yet', () => {
  const field = setup();

  type(field, 'BET 1850 AND 18');
  expect(slot().textContent).toBe(HELPER);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(field.getAttribute('aria-invalid')).toBeNull();
});

it('shows the reading as soon as the date parses', () => {
  const field = setup();

  type(field, 'BET 1850 AND 1855');
  expect(slot().textContent).toBe('Reads as Between 1850 and 1855');
  expect(slot().querySelector('strong')!.textContent).toBe(
    'Between 1850 and 1855'
  );
});

it('names the slot in aria-describedby', () => {
  const field = setup({ 'aria-describedby': 'other' });

  expect(field.getAttribute('aria-describedby')).toBe(`other ${slot().id}`);
});

it('names only the slot when the caller gives no description', () => {
  const field = setup();

  expect(field.getAttribute('aria-describedby')).toBe(slot().id);
});

it('checks on blur: 31 FEB 1850 keeps its text and shows the message', () => {
  const field = setup();

  type(field, '31 FEB 1850');
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.blur(field);

  expect(field.value).toBe('31 FEB 1850');
  expect(field.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByRole('alert').textContent).toBe(
    'February 1850 has 28 days.'
  );
  expect(slot().contains(screen.getByRole('alert'))).toBe(true);
  expect(field.closest('span')!.getAttribute('data-mark')).toBe('error');
});

it('checks on Enter, not on another key', () => {
  const field = setup();

  type(field, '14/03/1850');
  fireEvent.keyDown(field, { key: 'a' });
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.keyDown(field, { key: 'Enter' });
  expect(screen.getByRole('alert').textContent).toBe(
    'Use a date like 1850, 14 MAR 1850, ABT 1850 or BET 1850 AND 1855.'
  );
});

it('keeps the error while typing, and the next check replaces it', () => {
  const field = setup();

  type(field, '31 FEB 1850');
  fireEvent.blur(field);
  type(field, '28 FEB 1850');
  expect(screen.getByRole('alert').textContent).toBe(
    'February 1850 has 28 days.'
  );
  fireEvent.blur(field);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(field.getAttribute('aria-invalid')).toBeNull();
  expect(slot().textContent).toBe('Reads as On 28 February 1850');
});

it('reads leap years', () => {
  const field = setup();

  type(field, '29 FEB 1904');
  fireEvent.blur(field);
  expect(slot().textContent).toBe('Reads as On 29 February 1904');
  type(field, '29 FEB 1900');
  fireEvent.blur(field);
  expect(screen.getByRole('alert').textContent).toBe(
    'February 1900 has 28 days.'
  );
});

it('checks a default value on the first render', () => {
  const field = setup({ defaultValue: '31 FEB 1850' });

  expect(field.value).toBe('31 FEB 1850');
  expect(screen.getByRole('alert').textContent).toBe(
    'February 1850 has 28 days.'
  );
});

it('does not check a default value in the focus state', () => {
  setup({ defaultValue: '31 FEB 1850', state: 'focus' });

  expect(screen.queryByRole('alert')).toBeNull();
});

it('shows nothing when there is no helper', () => {
  setup({ helper: undefined });

  expect(slot().textContent).toBe('');
});

it('passes other attributes to the input', () => {
  const field = setup({ disabled: true, name: 'born' });

  expect(field.disabled).toBe(true);
  expect(field.name).toBe('born');
});

it('sets the input in 15 / 22 Mono from a token, ligatures off, and 16 / 24 on a phone', () => {
  const input = /^\.input \{[^}]*\}/m.exec(css)![0];
  const phone = /@media[^{]*\{\s*\.input \{[^}]*\}/.exec(css)![0];

  expect(css).toContain("composes: box from '@ks/app/components/forms/");
  expect(input).toContain('font-size: var(--type-mono-m-size)');
  expect(input).toContain('line-height: var(--type-mono-m-line)');
  expect(input).toContain('font-variant-ligatures: none');
  expect(phone).toContain('font-size: var(--type-body-l-size)');
  expect(phone).toContain('line-height: var(--type-body-l-line)');
});

it('sets the reading in 600 weight and the ink colour, as the Fuzzy-date-readings board does', () => {
  const reading = /^\.reading \{[^}]*\}/m.exec(css)?.[0] ?? '';

  setup({ defaultValue: 'ABT 1850' });
  expect(slot().querySelector('strong')!.className).toContain('reading');
  expect(reading).toContain('color: var(--ink)');
  expect(reading).toContain('font-weight: var(--type-label-weight)');
});
