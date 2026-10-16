import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('@/components/MapView', () => ({
  default: () => <div data-testid='map-view' />,
}));

import Home from '../page';

it('renders the map', () => {
  const { getByTestId } = render(<Home />);

  expect(getByTestId('map-view')).toBeTruthy();
});
