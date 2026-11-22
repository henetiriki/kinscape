import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { SearchBar } from '@ks/features/map/components/SearchBar';

// EXP-04
it('wraps a search input named "Search people and places" in a search form', () => {
  render(<SearchBar form='bar' />);

  const input = screen.getByRole('searchbox', {
    name: 'Search people and places',
  });

  const form = screen.getByRole('search');

  expect(input.getAttribute('type')).toBe('search');
  expect(input.getAttribute('aria-keyshortcuts')).toBe('/');
  expect(
    within(form)
      .getAllByRole('img', { hidden: true })
      .map(icon => icon.dataset.icon)
  ).toContain('search');
});

it('draws the bar as the Wordmark, a divider and the field, with a decorative icon', () => {
  render(<SearchBar form='bar' />);
  const bar = screen.getByRole('search');

  expect(within(bar).getByRole('presentation').getAttribute('alt')).toBe('');
  screen.getByText('KinScape');
  screen.getByTestId('divider');
});

it('draws the pill as the named icon, the bare field and the account slot', () => {
  render(
    <SearchBar account={<button type='button'>Account</button>} form='pill' />
  );

  screen.getByRole('img', { name: 'KinScape' });
  expect(screen.queryByText('KinScape')).toBeNull();
  screen.getByRole('button', { name: 'Account' });
  expect(
    screen
      .getByRole('searchbox', { name: 'Search people and places' })
      .hasAttribute('aria-keyshortcuts')
  ).toBe(false);
});

it('does not submit the page', () => {
  render(<SearchBar form='bar' />);

  expect(fireEvent.submit(screen.getByRole('search'))).toBe(false);
});

it('focuses the bar on "/" and leaves the pill alone', () => {
  const { unmount } = render(<SearchBar form='bar' />);

  fireEvent.keyDown(document.body, { key: '/' });

  expect(screen.getByRole('searchbox')).toHaveFocus();

  unmount();
  render(<SearchBar form='pill' />);
  fireEvent.keyDown(document.body, { key: '/' });

  expect(document.body).toHaveFocus();
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
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).not.toHaveFocus();
  }
);

it('ignores other keys', () => {
  render(<SearchBar defaultValue='Kimberley' form='bar' />);

  const input = screen.getByRole<HTMLInputElement>('searchbox');

  input.focus();
  fireEvent.keyDown(input, { key: 'a' });

  expect(input.value).toBe('Kimberley');
  expect(input).toHaveFocus();
});

it('lets the first of two bars take "/"', () => {
  render(
    <>
      <SearchBar form='bar' />
      <SearchBar form='bar' />
    </>
  );

  fireEvent.keyDown(document.body, { key: '/' });

  expect(screen.getAllByRole('searchbox')[0]).toHaveFocus();
});
