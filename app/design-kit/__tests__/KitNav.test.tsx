import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const pathname = vi.hoisted(() => ({ current: '/design-kit' }));

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

import { KitNav } from '../KitNav';

const links = () =>
  within(screen.getByRole('navigation', { name: 'Boards' })).getAllByRole(
    'link'
  );

// NFR-06
it('links each board in order', () => {
  pathname.current = '/design-kit';
  render(<KitNav />);

  expect(
    links().map(link => [link.textContent, link.getAttribute('href')])
  ).toEqual([
    ['Typography and hierarchy', '/design-kit/type'],
    ['Component states', '/design-kit/states'],
  ]);
  expect(links().some(link => link.hasAttribute('aria-current'))).toBe(false);
});

it.each([
  ['/design-kit/type', 'Typography and hierarchy'],
  ['/design-kit/states', 'Component states'],
])('on %s, marks only %s as the current page', (path, current) => {
  pathname.current = path;
  render(<KitNav />);

  expect(
    links()
      .filter(link => link.getAttribute('aria-current') === 'page')
      .map(link => link.textContent)
  ).toEqual([current]);
});
