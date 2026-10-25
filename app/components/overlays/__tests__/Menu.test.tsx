import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Avatar } from '@/app/components/map/Avatar';
import { Menu, MenuItem, MenuPanel } from '@/app/components/overlays/Menu';

const GROUPS = [
  [
    {
      detail: 'JSON and GeoJSON',
      icon: 'export',
      id: 'export',
      label: 'Export',
    },
    { icon: 'document', id: 'sources', label: 'Sources' },
  ],
  [
    { disabled: true, icon: 'signOut', id: 'out', label: 'Sign out' },
    { icon: 'info', id: 'about', label: 'About' },
  ],
] as const;

const MENU = {
  email: 'researcher@example.com',
  footer: 'Last backup: today, 02:00',
  groups: GROUPS.map(group => [...group]),
  initial: 'L',
};

const setup = (onSelect: (id: string) => void = vi.fn()) => {
  render(<Menu {...MENU} onSelect={onSelect} />);

  return {
    avatar: screen.getByRole('button', { name: 'Account menu' }),
    onSelect,
  };
};

const open = () => {
  const made = setup();

  fireEvent.click(made.avatar);

  return made;
};

const items = () => screen.getAllByRole('menuitem');
const key = (name: string) =>
  fireEvent.keyDown(document.activeElement!, { key: name });

// NFR-05, NFR-06
it('is a button named "Account menu" with the initial, haspopup and expanded', () => {
  const { avatar } = setup();

  expect(avatar.textContent).toBe('L');
  expect(avatar.getAttribute('aria-haspopup')).toBe('menu');
  expect(avatar.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('menu')).toBeNull();
});

it('is closed unless told it is open', () => {
  render(<Avatar initial='L' />);
  expect(
    screen
      .getByRole('button', { name: 'Account menu' })
      .getAttribute('aria-expanded')
  ).toBe('false');
});

it('draws a state and its open look', () => {
  render(<Avatar expanded initial='L' state='hover' />);

  const avatar = screen.getByRole('button', { name: 'Account menu' });

  expect(avatar.getAttribute('data-state')).toBe('hover');
  expect(avatar.getAttribute('aria-expanded')).toBe('true');
});

it('opens a menu named "Account" and focuses its first item', () => {
  const { avatar } = open();

  expect(avatar.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('menu', { name: 'Account' })).toBeTruthy();
  expect(document.activeElement).toBe(items()[0]);
  expect(screen.getByText('researcher@example.com')).toBeTruthy();
  expect(screen.getByText('Last backup: today, 02:00')).toBeTruthy();
});

it('keeps the header and footer out of the menu, so arrow keys skip them', () => {
  open();

  const menu = screen.getByRole('menu');

  expect(menu.contains(screen.getByText('Signed in as'))).toBe(false);
  expect(menu.contains(screen.getByText('Last backup: today, 02:00'))).toBe(
    false
  );
  expect(items().map(item => item.textContent)).toEqual([
    'ExportJSON and GeoJSON',
    'Sources',
    'Sign out',
    'About',
  ]);
});

it('moves with the arrow keys and wraps at both ends', () => {
  open();
  key('ArrowDown');
  expect(document.activeElement).toBe(items()[1]);
  key('ArrowUp');
  key('ArrowUp');
  expect(document.activeElement).toBe(items()[3]);
  key('ArrowDown');
  expect(document.activeElement).toBe(items()[0]);
});

it('keeps a disabled item in the key order, aria-disabled, and does nothing on Enter', () => {
  const { onSelect } = open();

  key('ArrowDown');
  key('ArrowDown');
  expect(document.activeElement).toBe(items()[2]);
  expect(items()[2].getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(items()[2]);
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByRole('menu')).toBeTruthy();
});

it('focuses the Avatar, closes, then runs onSelect', () => {
  const focused: unknown[] = [];
  const { avatar } = setup(() => focused.push(document.activeElement));

  fireEvent.click(avatar);
  key('ArrowDown');
  fireEvent.click(document.activeElement!);

  expect(focused).toEqual([avatar]);
  expect(screen.queryByRole('menu')).toBeNull();
});

it('closes on Esc with focus on the Avatar, and the Esc goes no further', () => {
  const { avatar } = open();
  const outer = vi.fn();

  document.addEventListener('keydown', outer);

  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  });

  act(() => {
    items()[0].dispatchEvent(event);
  });
  document.removeEventListener('keydown', outer);

  expect(event.defaultPrevented).toBe(true);
  expect(outer).not.toHaveBeenCalled();
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(avatar);
});

it('closes on Tab, and ignores other keys', () => {
  open();
  key('a');
  expect(screen.getByRole('menu')).toBeTruthy();
  key('Tab');
  expect(screen.queryByRole('menu')).toBeNull();
});

it('closes on a press outside, not on one inside, and stops listening once closed', () => {
  const { avatar } = open();

  fireEvent.pointerDown(items()[0]);
  expect(screen.getByRole('menu')).toBeTruthy();
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(avatar);
  fireEvent.click(avatar);
  expect(screen.queryByRole('menu')).toBeNull();
});

it('draws a panel inert, with one item hovered', () => {
  const { container } = render(<MenuPanel {...MENU} hovered='sources' inert />);

  expect(container.querySelector('[inert]')).toBeTruthy();
  expect(
    [...container.querySelectorAll('[data-state]')].map(
      item => item.textContent
    )
  ).toEqual(['Sources']);
});

it('draws a lone item in a state, without a handler', () => {
  render(<MenuItem entry={GROUPS[0][1]} state='focus' />);
  fireEvent.click(screen.getByRole('menuitem'));
  expect(screen.getByRole('menuitem').getAttribute('data-state')).toBe('focus');
});
