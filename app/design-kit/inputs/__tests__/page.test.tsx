import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';

import InputsKit from '../page';

const show = async (part?: string | string[]) =>
  render(await InputsKit({ searchParams: Promise.resolve({ part }) }));

// NFR-06
it('shows the eight sections in board order, each with Measurements and Accessibility', async () => {
  await show();

  expect(
    screen.getByRole('heading', { level: 1, name: 'Inputs and actions' })
  ).toBeTruthy();
  expect(
    screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
  ).toEqual([
    'Buttons',
    'Text fields',
    'Chips',
    'Tabs',
    'Checkbox field',
    'Alerts',
    'Dividers',
    'Key hints',
  ]);
  expect(
    screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
  ).toEqual(Array(8).fill(['Measurements', 'Accessibility']).flat());
});

it('draws each interactive component in five states, in the order drawn', async () => {
  await show();

  const names = (label: string) =>
    [
      ...screen
        .getByRole('figure', { name: label })
        .querySelectorAll('.row:not(.columns) > .name > :first-child'),
    ].map(name => name.textContent);

  expect(names('Button states')).toEqual([
    'Primary, card',
    'Secondary',
    'Play',
    'Play, icon only',
  ]);
  expect(names('Field states')).toEqual(['Password', 'Select']);
  expect(names('Chip states')).toEqual(['Event chip, off', 'Event chip, on']);
  expect(names('Removable chip states')).toEqual(['Removable chip']);
  expect(names('Tab states')).toEqual(['Tab with badge', 'Tab with badge, on']);
  expect(names('Checkbox field states')).toEqual([
    'Layer row, off',
    'Layer row, on',
    'Label only',
  ]);

  const matrix = screen.getByRole('figure', { name: 'Button states' });

  expect(matrix.querySelectorAll('.cell')).toHaveLength(20);
  expect(matrix.querySelectorAll('.cell[inert]')).toHaveLength(12);
  // A phone draws Play only icon-only, and labels Focus without "(keyboard)".
  expect(
    [
      ...matrix.querySelectorAll('.row[data-desktop] > .name > :first-child'),
    ].map(name => name.textContent)
  ).toEqual(['Play']);
  expect(
    [...matrix.querySelectorAll('.stateLabel')]
      .slice(0, 5)
      .map(l => l.textContent)
  ).toEqual(['Default', 'Hover', 'Focus', 'Pressed', 'Disabled']);
  expect(
    within(
      screen.getByRole('figure', { name: 'Removable chip states' })
    ).queryByText('Disabled')
  ).toBeNull();
});

it('draws both words where a phone reads differently, each hidden on the other', async () => {
  await show();

  const keyHints = screen.getByRole('region', { name: 'Key hints' });

  expect(within(keyHints).getByText(/See the desktop board\.$/).className).toBe(
    'phoneOnly'
  );
  expect(
    within(keyHints).getByText(/^Show a keyboard shortcut/).className
  ).toBe('desktopOnly');
  expect(
    within(screen.getByRole('figure', { name: 'Tab states' })).getByText(
      'Filters, not selected'
    ).className
  ).toBe('phoneOnly');
});

it('shows every button form, field form and chip', async () => {
  await show();

  const buttons = within(screen.getByRole('region', { name: 'Buttons' }));

  expect(
    buttons.getAllByRole('button', { name: 'Sign in' }).length
  ).toBeGreaterThan(0);
  expect(buttons.getAllByRole('button', { name: 'Copy chain' })).toHaveLength(
    1
  );
  expect(
    buttons.getAllByRole('button', { name: 'Play through time' }).length
  ).toBeGreaterThan(0);

  const fields = within(screen.getByRole('region', { name: 'Text fields' }));

  // Hidden: one in the variants and four in the states; shown: one in each, Pressed in the states.
  expect(fields.getAllByRole('button', { name: 'Show password' })).toHaveLength(
    5
  );
  expect(fields.getAllByRole('button', { name: 'Hide password' })).toHaveLength(
    2
  );
  expect(fields.getAllByRole('combobox').length).toBeGreaterThan(1);
  expect(fields.getAllByRole('searchbox').length).toBeGreaterThan(0);
  expect(
    fields.getAllByRole('button', { name: 'Remove Rossouw' }).length
  ).toBeGreaterThan(0);

  const chips = within(screen.getByRole('region', { name: 'Chips' }));

  // Nine event chips (four on) plus one chip in each of the five states.
  expect(chips.getAllByRole('button', { pressed: true })).toHaveLength(9);
  expect(chips.getAllByRole('button', { pressed: false })).toHaveLength(10);

  expect(
    within(screen.getByRole('region', { name: 'Tabs' })).getAllByRole('tab', {
      name: 'Filters, 1 active',
    }).length
  ).toBeGreaterThan(0);
  expect(
    within(screen.getByRole('region', { name: 'Checkbox field' })).getAllByRole(
      'checkbox',
      { name: 'Keep me signed in on this device' }
    ).length
  ).toBeGreaterThan(0);
  expect(
    within(screen.getByRole('region', { name: 'Alerts' })).getAllByRole('alert')
  ).toHaveLength(1);
});

it('links to part 2 and marks part 1 for a phone by default', async () => {
  await show();

  const main = screen.getByRole('main');

  expect(main.dataset.part).toBe('1');
  expect(
    screen.getByRole('link', { name: /^Part 2: tabs/ }).getAttribute('href')
  ).toBe('/design-kit/inputs?part=2');
  expect(screen.getByText(/part 1 of 2/)).toBeTruthy();
});

it('shows part 2 for ?part=2, linked back to part 1', async () => {
  await show('2');

  expect(screen.getByRole('main').dataset.part).toBe('2');
  expect(
    screen.getByRole('link', { name: /^Part 1: buttons/ }).getAttribute('href')
  ).toBe('/design-kit/inputs');
  expect(screen.getByText(/part 2 of 2/)).toBeTruthy();
});

it('treats any other part as part 1', async () => {
  await show(['2', '1']);

  expect(screen.getByRole('main').dataset.part).toBe('1');
});
