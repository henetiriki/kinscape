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
vi.mock('@ks/server/auth/current.mts', () => ({
  currentSession: session,
  signOut: vi.fn(),
}));
vi.mock('@ks/app/@map/MapWithPins', () => ({
  MapWithPins: (props: {
    coverage: unknown[];
    email: string;
    initial: string;
    onSignOut: unknown;
    sources: unknown[];
  }) => {
    shell(props);

    return <div data-testid='map-shell' />;
  },
}));

import MapSlot from '@ks/app/@map/page';
import { signOutAction } from '@ks/app/sign-in/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

// NFR-03
describe('the map slot page', () => {
  it('renders the map with the sources and coverage from the data folder', async () => {
    session.mockResolvedValue({ accountId: 'a', email: 'a@example.test' });

    const { getByTestId } = render(await MapSlot());

    getByTestId('map-shell');
    expect(shell.mock.calls[0][0].sources.length).toBeGreaterThan(0);
    expect(shell.mock.calls[0][0].coverage.length).toBeGreaterThan(0);
  });

  it("passes the session's email, its upper-case first letter and the sign-out action", async () => {
    session.mockResolvedValue({ accountId: 'a', email: 'ada@example.test' });

    render(await MapSlot());

    expect(shell.mock.calls[0][0].email).toBe('ada@example.test');
    expect(shell.mock.calls[0][0].initial).toBe('A');
    expect(shell.mock.calls[0][0].onSignOut).toBe(signOutAction);
  });

  it('sends a visitor with no valid session to the sign-in page', async () => {
    session.mockResolvedValue(undefined);

    await expect(MapSlot()).rejects.toThrow('redirect:/sign-in');
    expect(shell).not.toHaveBeenCalled();
  });
});
