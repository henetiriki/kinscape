import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const shell = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@ks/server/auth/current.mts', () => ({ currentSession: session }));
vi.mock('@ks/features/map', () => ({
  MapShell: (props: {
    coverage: unknown[];
    layers: unknown[];
    sources: unknown[];
  }) => {
    shell(props);

    return <div data-testid='map-shell' />;
  },
  polityLayer: { name: 'polity layer' },
}));

import Home from '@ks/app/page';

beforeEach(() => {
  vi.clearAllMocks();
});

// NFR-03
describe('the map page', () => {
  it('renders the map with the sources and coverage from the data folder', async () => {
    session.mockResolvedValue({ accountId: 'a', email: 'a@example.test' });

    const { getByTestId } = render(await Home());

    expect(getByTestId('map-shell')).toBeTruthy();
    expect(shell.mock.calls[0][0].sources.length).toBeGreaterThan(0);
    expect(shell.mock.calls[0][0].coverage.length).toBeGreaterThan(0);
    expect(shell.mock.calls[0][0].layers).toEqual([{ name: 'polity layer' }]);
  });

  it('sends a visitor with no valid session to the sign-in page', async () => {
    session.mockResolvedValue(undefined);

    await expect(Home()).rejects.toThrow('redirect:/sign-in');
    expect(shell).not.toHaveBeenCalled();
  });
});
