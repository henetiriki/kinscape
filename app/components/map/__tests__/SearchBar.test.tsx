import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { SearchBar } from '../SearchBar';

// EXP-04
it('wraps a search input named "Search people and places" in a search form', () => {
  render(<SearchBar form='bar' />);

  const input = screen.getByRole('searchbox', {
    name: 'Search people and places',
  });

  expect(screen.getByRole('search')).toBeTruthy();
  expect(input.getAttribute('type')).toBe('search');
  expect(input.getAttribute('aria-keyshortcuts')).toBe('/');
  expect(
    screen.getByRole('search').querySelector('[data-icon="search"]')
  ).toBeTruthy();
});

it('draws the bar as the Wordmark, a divider and the field, with a decorative icon', () => {
  const { container } = render(<SearchBar form='bar' />);
  const bar = screen.getByRole('search');

  expect(bar.querySelector('img')!.getAttribute('alt')).toBe('');
  expect(screen.getByText('KinScape')).toBeTruthy();
  expect(container.querySelector('[aria-hidden="true"]:empty')).toBeTruthy();
});

it('draws the pill as the named icon, the bare field and the account slot', () => {
  render(
    <SearchBar account={<button type='button'>Account</button>} form='pill' />
  );

  expect(screen.getByRole('img', { name: 'KinScape' })).toBeTruthy();
  expect(screen.queryByText('KinScape')).toBeNull();
  expect(screen.getByRole('button', { name: 'Account' })).toBeTruthy();
  expect(
    screen
      .getByRole('searchbox', { name: 'Search people and places' })
      .getAttribute('aria-keyshortcuts')
  ).toBeNull();
});

it('does not submit the page', () => {
  render(<SearchBar form='bar' />);

  expect(fireEvent.submit(screen.getByRole('search'))).toBe(false);
});

it('focuses the bar on "/" and leaves the pill alone', () => {
  const { unmount } = render(<SearchBar form='bar' />);

  fireEvent.keyDown(document.body, { key: '/' });

  expect(document.activeElement).toBe(screen.getByRole('searchbox'));

  unmount();
  render(<SearchBar form='pill' />);
  fireEvent.keyDown(document.body, { key: '/' });

  expect(document.activeElement).toBe(document.body);
});

it.each(['bar', 'pill'] as const)(
  'clears the %s on the first Esc and leaves it on the second',
  form => {
    const onChange = vi.fn();

    render(
      <SearchBar defaultValue='Kimberley' form={form} onChange={onChange} />
    );

    const input = screen.getByRole<HTMLInputElement>('searchbox');

    input.focus();

    expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(false);
    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(document.activeElement).not.toBe(input);
  }
);

it('ignores other keys', () => {
  render(<SearchBar defaultValue='Kimberley' form='bar' />);

  const input = screen.getByRole<HTMLInputElement>('searchbox');

  input.focus();
  fireEvent.keyDown(input, { key: 'a' });

  expect(input.value).toBe('Kimberley');
  expect(document.activeElement).toBe(input);
});

it('lets the first of two bars take "/"', () => {
  render(
    <>
      <SearchBar form='bar' />
      <SearchBar form='bar' />
    </>
  );

  fireEvent.keyDown(document.body, { key: '/' });

  expect(document.activeElement).toBe(screen.getAllByRole('searchbox')[0]);
});
