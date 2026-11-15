import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const pathname = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ usePathname: pathname }));

import { MapHost } from '@ks/app/MapHost';

const show = (path: string) => {
  pathname.mockReturnValue(path);
  render(
    <MapHost>
      <p data-testid='map'>Map</p>
    </MapHost>
  );
};

const host = () => screen.getByTestId('map').parentElement!;

describe('MapHost', () => {
  // MAP-01
  it('shows the map on the map page', () => {
    show('/');

    expect(host().hasAttribute('inert')).toBe(false);
    expect(host().dataset.hidden).toBeUndefined();
  });

  // PPL-01
  it.each(['/people', '/people/new', '/people/abc'])(
    'keeps the map mounted but hidden and inert on %s',
    path => {
      show(path);

      expect(host().hasAttribute('inert')).toBe(true);
      expect(host().dataset.hidden).toBe('');
    }
  );

  it.each(['/sign-in', '/peoplex', '/design-kit'])(
    'drops the map on %s',
    path => {
      show(path);

      expect(screen.queryByTestId('map')).toBeNull();
    }
  );
});
