import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Source } from '@ks/lib/domain/boundaries/types.ts';

import { Credits, sourcesOnScreen } from '@ks/features/map/components/Credits';

const source = (id: string, layer: string, attribution: string): Source => ({
  attribution,
  author: 'a',
  dateChecked: '2026-10-19',
  id,
  layer,
  licence: 'l',
  licenceLink: 'https://example.com',
  title: 't',
});

const sources = [
  source('land', 'Land', 'Made with Natural Earth'),
  source('admin', 'Polity borders', 'Made with Natural Earth'),
  source('font', 'Polity borders', 'Public Sans'),
  source('lib', 'Map renderer', 'MapLibre'),
];

// NFR-08
it('joins the credits of what is on screen, once each, ending in a link', () => {
  const { container } = render(
    <Credits onOpenAttributions={vi.fn()} showPolities sources={sources} />
  );

  expect(container.textContent).toBe(
    'Made with Natural Earth · Public Sans · MapLibre · Attributions'
  );
});

it('drops the credits of Polity borders while that layer is off', () => {
  const { container } = render(
    <Credits
      onOpenAttributions={vi.fn()}
      showPolities={false}
      sources={sources}
    />
  );

  expect(container.textContent).toBe(
    'Made with Natural Earth · MapLibre · Attributions'
  );
  expect(sourcesOnScreen(sources, false).map(s => s.id)).toEqual([
    'land',
    'lib',
  ]);
});

it('opens the dialog from the Attributions link', () => {
  const open = vi.fn();

  render(<Credits onOpenAttributions={open} showPolities sources={sources} />);
  fireEvent.click(screen.getByRole('button', { name: 'Attributions' }));

  expect(open).toHaveBeenCalledOnce();
});

const collapsible = (open = vi.fn()) =>
  render(
    <Credits
      collapsible
      onOpenAttributions={open}
      showPolities
      sources={sources}
    />
  );

// NFR-08
it('collapsed, shows one line: a Credits button and the Attributions link', () => {
  const { container } = collapsible();

  expect(container.textContent).toBe('Credits·Attributions');
  expect(
    screen
      .getByRole('button', { name: 'Credits' })
      .getAttribute('aria-expanded')
  ).toBe('false');
  expect(screen.queryByText(/Public Sans/)).toBeNull();
});

// NFR-08
it('opens the credits text in a card, once each, and closes it on a second press', () => {
  collapsible();

  const button = screen.getByRole('button', { name: 'Credits' });

  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(
    screen.getByText('Made with Natural Earth · Public Sans · MapLibre').id
  ).toBe(button.getAttribute('aria-controls'));

  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText(/Public Sans/)).toBeNull();
});

it('closes the card on Esc and ignores other keys', () => {
  collapsible();

  const button = screen.getByRole('button', { name: 'Credits' });

  fireEvent.click(button);
  fireEvent.keyDown(document, { key: 'a' });
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(button.getAttribute('aria-expanded')).toBe('false');
});

it('closes the card on a press outside it, and keeps it for a press inside', () => {
  collapsible();

  const button = screen.getByRole('button', { name: 'Credits' });

  fireEvent.click(button);
  fireEvent.pointerDown(screen.getByText(/Public Sans/));
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.pointerDown(document.body);
  expect(button.getAttribute('aria-expanded')).toBe('false');
});

it('keeps the card open when Esc closes a dialog', () => {
  collapsible();

  const button = screen.getByRole('button', { name: 'Credits' });
  const dialog = document.createElement('div');

  dialog.setAttribute('role', 'dialog');
  document.body.append(dialog);
  fireEvent.click(button);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  dialog.remove();

  expect(button.getAttribute('aria-expanded')).toBe('true');
});

it('keeps the card open for a press inside a dialog', () => {
  collapsible();

  const button = screen.getByRole('button', { name: 'Credits' });
  const dialog = document.createElement('dialog');

  document.body.append(dialog);
  fireEvent.click(button);
  fireEvent.pointerDown(dialog);
  dialog.remove();

  expect(button.getAttribute('aria-expanded')).toBe('true');
});

// #1074
it('opens the card at the first render with defaultOpen, and a second press closes it', () => {
  render(
    <Credits
      collapsible
      defaultOpen
      onOpenAttributions={vi.fn()}
      showPolities
      sources={sources}
    />
  );

  const button = screen.getByRole('button', { name: 'Credits' });

  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(
    screen.getByText('Made with Natural Earth · Public Sans · MapLibre').id
  ).toBe(button.getAttribute('aria-controls'));

  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
});

it('opens the dialog from the Attributions link while collapsed', () => {
  const open = vi.fn();

  collapsible(open);
  fireEvent.click(screen.getByRole('button', { name: 'Attributions' }));

  expect(open).toHaveBeenCalledOnce();
});
