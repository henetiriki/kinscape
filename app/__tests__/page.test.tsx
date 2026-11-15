import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@ks/server/auth/current.mts', () => ({ currentSession: session }));

import Home from '@ks/app/page';

beforeEach(() => {
  vi.clearAllMocks();
});

// NFR-03
describe('the map page', () => {
  it('renders nothing for a valid session: the @map slot draws the map', async () => {
    session.mockResolvedValue({ accountId: 'a', email: 'a@example.test' });

    expect(await Home()).toBeNull();
  });

  it('sends a visitor with no valid session to the sign-in page', async () => {
    session.mockResolvedValue(undefined);

    await expect(Home()).rejects.toThrow('redirect:/sign-in');
  });
});
