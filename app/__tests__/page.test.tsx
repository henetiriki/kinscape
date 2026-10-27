import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const shell = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/components/map/MapShell', () => ({
  MapShell: (props: { coverage: unknown[]; sources: unknown[] }) => {
    shell(props);

    return <div data-testid='map-shell' />;
  },
}));

import Home from '@ks/app/page';

it('renders the map with the sources and coverage from the data folder', () => {
  const { getByTestId } = render(<Home />);

  expect(getByTestId('map-shell')).toBeTruthy();
  expect(shell.mock.calls[0][0].sources.length).toBeGreaterThan(0);
  expect(shell.mock.calls[0][0].coverage.length).toBeGreaterThan(0);
});
