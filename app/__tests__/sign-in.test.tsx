import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  })
);

const adapters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('next/headers', () => ({ cookies: async () => jar }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@ks/server/adapters.mts', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  appAdapters: () => adapters.current,
}));
vi.mock('@ks/app/components/auth/SignInForm', () => ({
  SignInForm: (props: { returnTo?: string }) => (
    <form data-return-to={props.returnTo} data-testid='form' />
  ),
}));

import { signInAction, signOutAction } from '@ks/app/sign-in/actions';
import SignIn from '@ks/app/sign-in/page';
import { SYNTHETIC } from '@ks/server/adapters.mts';
import { memorySession } from '@ks/server/auth/memory-session.mts';
import { memorySessions } from '@ks/server/auth/memory-sessions.mts';
import { memoryThrottle } from '@ks/server/auth/memory-throttle.mts';
import {
  endedSessionCookie,
  SESSION_COOKIE,
  sessionOf,
  startSession,
} from '@ks/server/auth/sessions.mts';
import { memoryStore } from '@ks/server/trees/memory-store.mts';

const fresh = () => {
  adapters.current = {
    session: memorySession([SYNTHETIC]),
    sessions: memorySessions(),
    store: memoryStore([
      {
        id: SYNTHETIC.accountId,
        issuer: SYNTHETIC.issuer,
        subject: SYNTHETIC.subject,
        trees: [],
      },
    ]),
    throttle: memoryThrottle(),
  };
};

const form = (fields: Record<string, string>) => {
  const data = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }

  return data;
};

const RIGHT = { email: SYNTHETIC.email, password: SYNTHETIC.password };

beforeEach(() => {
  vi.clearAllMocks();
  jar.get.mockReturnValue(undefined);
  fresh();
});

// NFR-03
describe('the sign-in page', () => {
  it('shows the form, with a same-site return-to address', async () => {
    const page = await SignIn({
      searchParams: Promise.resolve({ returnTo: '/screens/add-pin' }),
    });
    const { getByTestId } = render(page);

    expect(getByTestId('form').getAttribute('data-return-to')).toBe(
      '/screens/add-pin'
    );
  });

  it('turns a return-to address on another site into the map', async () => {
    const page = await SignIn({
      searchParams: Promise.resolve({ returnTo: 'https://example.test/' }),
    });

    expect(
      render(page).getByTestId('form').getAttribute('data-return-to')
    ).toBe('/');
  });

  it('sends a valid session to the map', async () => {
    const sessions = (adapters.current as { sessions: never }).sessions;
    const token = await startSession(sessions, () => new Date(), {
      accountId: SYNTHETIC.accountId,
      email: SYNTHETIC.email,
    });

    jar.get.mockReturnValue({ value: token });

    await expect(SignIn({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'redirect:/'
    );
    expect(jar.get).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it.each([
    ['an unknown token', 'x'.repeat(43)],
    ['a malformed token', 'nope'],
  ])('shows the form for %s', async (_what, value) => {
    jar.get.mockReturnValue({ value });

    expect(
      render(await SignIn({ searchParams: Promise.resolve({}) })).getByTestId(
        'form'
      )
    ).toBeTruthy();
  });

  it('shows the form when the session store is down', async () => {
    adapters.current = {
      sessions: {
        find: async () => {
          throw new Error('down');
        },
      },
    };
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });

    expect(
      render(await SignIn({ searchParams: Promise.resolve({}) })).getByTestId(
        'form'
      )
    ).toBeTruthy();
  });
});

// NFR-03
describe('signInAction', () => {
  it('sets the session cookie and opens the map', async () => {
    await expect(signInAction(undefined, form(RIGHT))).rejects.toThrow(
      'redirect:/'
    );

    const [name, value, options] = jar.set.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];

    expect(name).toBe(SESSION_COOKIE);
    expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(options).toMatchObject({ httpOnly: true, secure: true });
  });

  it('goes to a same-site return-to address', async () => {
    await expect(
      signInAction(undefined, form({ ...RIGHT, returnTo: '/screens/add-pin' }))
    ).rejects.toThrow('redirect:/screens/add-pin');
  });

  it('opens the map instead of another site', async () => {
    await expect(
      signInAction(
        undefined,
        form({ ...RIGHT, returnTo: 'https://example.test/' })
      )
    ).rejects.toThrow('redirect:/');
  });

  it('returns refused for a wrong password and sets no cookie', async () => {
    expect(
      await signInAction(undefined, form({ ...RIGHT, password: 'wrong' }))
    ).toBe('refused');
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('returns refused for a form with no fields', async () => {
    expect(await signInAction(undefined, new FormData())).toBe('refused');
  });

  it('returns unavailable when Auth does not answer', async () => {
    adapters.current = {
      ...(adapters.current as object),
      session: {
        verify: async () => {
          throw new Error('down');
        },
      },
    };

    expect(await signInAction(undefined, form(RIGHT))).toBe('unavailable');
    expect(jar.set).not.toHaveBeenCalled();
  });
});

// NFR-03
describe('signOutAction', () => {
  const sessions = () => (adapters.current as { sessions: never }).sessions;
  const start = (email: string) =>
    startSession(sessions(), () => new Date(), {
      accountId: SYNTHETIC.accountId,
      email,
    });
  const ended = () => {
    const { name, options, value } = endedSessionCookie();

    return [name, value, options];
  };

  it('removes the session, clears the cookie and goes to /sign-in', async () => {
    const token = await start(SYNTHETIC.email);

    jar.get.mockReturnValue({ value: token });

    await expect(signOutAction()).rejects.toThrow('redirect:/sign-in');
    expect(jar.get).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(jar.set).toHaveBeenCalledWith(...ended());
    expect(
      await sessionOf(sessions(), () => new Date(), token)
    ).toBeUndefined();
  });

  it.each([
    ['no cookie', undefined],
    ['a malformed token', { value: 'nope' }],
    ['an unknown token', { value: 'x'.repeat(43) }],
  ])(
    'with %s clears the cookie, goes to /sign-in and keeps other sessions',
    async (_what, cookie) => {
      const other = await start('other@example.test');

      jar.get.mockReturnValue(cookie);

      await expect(signOutAction()).rejects.toThrow('redirect:/sign-in');
      expect(jar.set).toHaveBeenCalledWith(...ended());
      expect(
        await sessionOf(sessions(), () => new Date(), other)
      ).toBeDefined();
    }
  );

  it('throws and keeps the cookie when the session store is down', async () => {
    adapters.current = {
      sessions: {
        remove: async () => {
          throw new Error('down');
        },
      },
    };
    jar.get.mockReturnValue({ value: 'x'.repeat(43) });

    await expect(signOutAction()).rejects.toThrow('down');
    expect(jar.set).not.toHaveBeenCalled();
  });
});
