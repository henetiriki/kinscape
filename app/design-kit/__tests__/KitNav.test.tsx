import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const pathname = vi.hoisted(() => ({ current: '/design-kit' }));

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

import { KitNav, KitTitle } from '../KitNav';

// NFR-06
it.each([
  ['/design-kit', 'page'],
  ['/design-kit/type', null],
])('on %s, the title link has aria-current %s', (path, current) => {
  pathname.current = path;
  render(<KitTitle />);

  const link = screen.getByRole('link', { name: 'KinScape design kit' });

  expect(link.getAttribute('href')).toBe('/design-kit');
  expect(link.getAttribute('aria-current')).toBe(current);
});

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
    ['Typography', '/design-kit/type'],
    ['Colour', '/design-kit/colour'],
    ['Foundations', '/design-kit/foundations'],
    ['Component states', '/design-kit/states'],
    ['Feedback', '/design-kit/feedback'],
    ['Inputs and actions', '/design-kit/inputs'],
    ['Surfaces', '/design-kit/surfaces'],
    ['Map furniture', '/design-kit/map-furniture'],
    ['Map style', '/design-kit/map-style'],
  ]);
  expect(links().some(link => link.hasAttribute('aria-current'))).toBe(false);
});

it.each([
  ['/design-kit/type', 'Typography'],
  ['/design-kit/states', 'Component states'],
  ['/design-kit/feedback', 'Feedback'],
])('on %s, marks only %s as the current page', (path, current) => {
  pathname.current = path;
  render(<KitNav />);

  expect(
    links()
      .filter(link => link.getAttribute('aria-current') === 'page')
      .map(link => link.textContent)
  ).toEqual([current]);
});
