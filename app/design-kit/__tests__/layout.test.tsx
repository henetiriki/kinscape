import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);

vi.mock('next/navigation', () => ({
  notFound,
  usePathname: () => '/design-kit/type',
}));

import DesignKitLayout, { metadata } from '../layout';

afterEach(() => vi.unstubAllEnvs());

// NFR-03
it('is a 404 in production, for every kit page', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  expect(() =>
    render(
      <DesignKitLayout>
        <p>board</p>
      </DesignKitLayout>
    )
  ).toThrow('NEXT_NOT_FOUND');
  expect(notFound).toHaveBeenCalled();
});

// NFR-06
it('shows the banner, hidden from the design check, then the page outside production', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  render(
    <DesignKitLayout>
      <h1>Board</h1>
    </DesignKitLayout>
  );

  const banner = screen.getByRole('banner');

  expect(banner.hasAttribute('data-design-hide')).toBe(true);
  expect(banner.textContent).toContain('KinScape design kit');
  expect(screen.getByRole('navigation', { name: 'Boards' })).toBeTruthy();
  // The kit's name is not a heading: the page's title is the only h1.
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(
    banner.compareDocumentPosition(
      screen.getByRole('heading', { name: 'Board' })
    )
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it('titles each page after its board', () => {
  expect(metadata.title).toEqual({
    default: 'KinScape design kit',
    template: '%s · KinScape design kit',
  });
});
