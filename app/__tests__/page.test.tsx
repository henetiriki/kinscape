import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const shell = vi.hoisted(() => vi.fn());

vi.mock('@/components/MapShell', () => ({
  MapShell: (props: { sources: unknown[] }) => {
    shell(props);

    return <div data-testid='map-shell' />;
  },
}));

import Home from '../page';

it('renders the map with the sources from the data folder', () => {
  const { getByTestId } = render(<Home />);

  expect(getByTestId('map-shell')).toBeTruthy();
  expect(shell.mock.calls[0][0].sources.length).toBeGreaterThan(0);
});
