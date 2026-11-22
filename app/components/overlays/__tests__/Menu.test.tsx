import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Menu, MenuItem, MenuPanel } from '@ks/app/components/overlays/Menu';

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
  initial: 'R',
};

const FORMS = [undefined, 'phone'] as const;

type Form = (typeof FORMS)[number];

const setup = (onSelect: (id: string) => void = vi.fn(), form?: Form) => {
  render(<Menu {...MENU} form={form} onSelect={onSelect} />);

  return {
    avatar: screen.getByRole('button', { name: 'Account menu' }),
    onSelect,
  };
};

const open = (form?: Form) => {
  const made = setup(vi.fn(), form);

  fireEvent.click(made.avatar);

  return made;
};

const items = () => screen.getAllByRole('menuitem');
const EXPORT = /^Export/;

const item = (name: RegExp | string) => screen.getByRole('menuitem', { name });

/** Checks that the menuitem `focused` has focus, then sends it the key. */
const key = (name: string, focused: RegExp | string) => {
  const target = item(focused);

  expect(target).toHaveFocus();
  fireEvent.keyDown(target, { key: name });
};

// NFR-05, NFR-06
it('is a button named "Account menu" with the initial, haspopup and expanded', () => {
  const { avatar } = setup();

  expect(avatar.textContent).toBe('R');
  expect(avatar.getAttribute('aria-haspopup')).toBe('menu');
  expect(avatar.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('menu')).toBeNull();
});

it('opens a menu named "Account" and focuses its first item', () => {
  const { avatar } = open();

  expect(avatar.getAttribute('aria-expanded')).toBe('true');
  screen.getByRole('menu', { name: 'Account' });
  expect(items()[0]).toHaveFocus();
  screen.getByText('researcher@example.com');
  screen.getByText('Last backup: today, 02:00');
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
  key('ArrowDown', EXPORT);
  expect(items()[1]).toHaveFocus();
  key('ArrowUp', 'Sources');
  key('ArrowUp', EXPORT);
  expect(items()[3]).toHaveFocus();
  key('ArrowDown', 'About');
  expect(items()[0]).toHaveFocus();
});

it('keeps a disabled item in the key order, aria-disabled, and does nothing on Enter', () => {
  const { onSelect } = open();

  key('ArrowDown', EXPORT);
  key('ArrowDown', 'Sources');
  expect(items()[2]).toHaveFocus();
  expect(items()[2].getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(items()[2]);
  expect(onSelect).not.toHaveBeenCalled();
  screen.getByRole('menu');
});

it('focuses the Avatar, closes, then runs onSelect', () => {
  const focused: boolean[] = [];
  const { avatar } = setup(() =>
    focused.push(
      screen.getByRole('button', { name: 'Account menu' }).matches(':focus')
    )
  );

  fireEvent.click(avatar);
  key('ArrowDown', EXPORT);

  const sources = item('Sources');

  expect(sources).toHaveFocus();
  fireEvent.click(sources);

  expect(focused).toEqual([true]);
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
  expect(avatar).toHaveFocus();
});

it('closes on Tab, and ignores other keys', () => {
  open();
  key('a', EXPORT);
  screen.getByRole('menu');
  key('Tab', EXPORT);
  expect(screen.queryByRole('menu')).toBeNull();
});

it('closes on a press outside, not on one inside, and stops listening once closed', () => {
  const { avatar } = open();

  fireEvent.pointerDown(items()[0]);
  screen.getByRole('menu');
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(avatar);
  fireEvent.click(avatar);
  expect(screen.queryByRole('menu')).toBeNull();
});

// NFR-03
it('draws no footer line when there is no footer, and the groups stay', () => {
  const bare = { ...MENU, footer: undefined };
  const { container } = render(<MenuPanel {...bare} />);

  expect(container.textContent).toBe(
    'Signed in asresearcher@example.comExportJSON and GeoJSONSourcesSign outAbout'
  );
  expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(
    ['ExportJSON and GeoJSON', 'Sources', 'Sign out', 'About']
  );
  // eslint-disable-next-line testing-library/prefer-presence-queries, testing-library/no-node-access -- the test checks that no node follows the menu
  expect(screen.getByRole('menu').nextElementSibling).toBeNull();
});

// NFR-03
it('opens a Menu with no footer and the same items', () => {
  const bare = { ...MENU, footer: undefined };

  render(<Menu {...bare} onSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  expect(items()).toHaveLength(4);
  // eslint-disable-next-line testing-library/prefer-presence-queries, testing-library/no-node-access -- the test checks that no node follows the menu
  expect(screen.getByRole('menu').nextElementSibling).toBeNull();
});

// NFR-03
it('sets data-form on the anchor and the drop only in the phone form', () => {
  const { container } = render(
    <Menu {...MENU} form='phone' onSelect={vi.fn()} />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the anchor and the drop are divs with no role or text
  expect(container.querySelectorAll('[data-form=phone]')).toHaveLength(2);
});

it('sets no data-form without a form', () => {
  const { container } = render(<Menu {...MENU} onSelect={vi.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the anchor and the drop are divs with no role or text
  expect(container.querySelector('[data-form]')).toBeNull();
});

it.each(FORMS)(
  'moves with arrows, closes on Esc, Tab and outside press (%s)',
  form => {
    const { avatar } = open(form);

    key('ArrowDown', EXPORT);
    expect(items()[1]).toHaveFocus();
    key('Escape', 'Sources');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(avatar).toHaveFocus();
    fireEvent.click(avatar);
    key('Tab', EXPORT);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(avatar);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  }
);

it('draws a panel inert, with one item hovered', () => {
  const { container } = render(<MenuPanel {...MENU} hovered='sources' inert />);

  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the inert wrapper is a div with no role or text
  expect(container.querySelector('[inert]')).toBeTruthy();
  expect(
    screen
      .getAllByRole('menuitem', { hidden: true })
      .filter(item => item.hasAttribute('data-state'))
      .map(item => item.textContent)
  ).toEqual(['Sources']);
});

it('draws a lone item in a state, without a handler', () => {
  render(<MenuItem entry={GROUPS[0][1]} state='focus' />);
  fireEvent.click(screen.getByRole('menuitem'));
  expect(screen.getByRole('menuitem').getAttribute('data-state')).toBe('focus');
});
