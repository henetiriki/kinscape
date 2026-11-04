import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SignInState } from '@ks/app/components/auth/SignInForm';

import { SignInForm } from '@ks/app/components/auth/SignInForm';

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  });
};

const field = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

// NFR-03
describe('SignInForm', () => {
  it('shows the title, the lede, both fields and no-sign-up', () => {
    render(<SignInForm action={async () => undefined} />);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
    expect(
      screen.getByText('Your tree is private. Sign in to open the map.')
    ).toBeTruthy();
    expect(field('Email').getAttribute('autocomplete')).toBe('username');
    expect(field('Password').getAttribute('autocomplete')).toBe(
      'current-password'
    );
    expect(screen.getByText(/There's no sign-up/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sends the typed details and the return-to address to the action', async () => {
    const action = vi.fn(async (): Promise<SignInState> => undefined);

    render(<SignInForm action={action} returnTo='/screens/add-pin' />);
    type('Email', 'researcher@example.com');
    type('Password', 'example-password');
    await submit();

    const data = (
      action.mock.calls[0] as unknown as [SignInState, FormData]
    )[1];

    expect(data.get('email')).toBe('researcher@example.com');
    expect(data.get('password')).toBe('example-password');
    expect(data.get('returnTo')).toBe('/screens/add-pin');
  });

  it('sends no return-to address when it has none', async () => {
    const action = vi.fn(async (): Promise<SignInState> => undefined);

    render(<SignInForm action={action} />);
    type('Email', 'a@example.com');
    type('Password', 'x');
    await submit();

    expect(
      (action.mock.calls[0] as unknown as [SignInState, FormData])[1].has(
        'returnTo'
      )
    ).toBe(false);
  });

  it('shows the wrong-details error, keeps the email and empties the password', async () => {
    render(<SignInForm action={async () => 'refused'} />);
    type('Email', 'researcher@example.com');
    type('Password', 'wrong');
    await submit();

    expect(screen.getByRole('alert').textContent).toContain(
      "That email and password don't match."
    );
    expect(field('Email').value).toBe('researcher@example.com');
    expect(field('Password').value).toBe('');
    expect(field('Email').getAttribute('aria-invalid')).toBe('true');
    expect(field('Password').getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('Password cleared after a failed attempt.')
    ).toBeTruthy();
  });

  it("shows the can't-sign-in state and keeps both fields", async () => {
    render(<SignInForm action={async () => 'unavailable'} />);
    type('Email', 'researcher@example.com');
    type('Password', 'example-password');
    await submit();

    expect(screen.getByRole('alert').textContent).toContain(
      "KinScape can't sign you in right now."
    );
    expect(field('Email').value).toBe('researcher@example.com');
    expect(field('Password').value).toBe('example-password');
    expect(field('Email').getAttribute('aria-invalid')).toBeNull();
  });

  it('disables the button while the action runs', async () => {
    let finish: (state: SignInState) => void = () => {};
    const action = () =>
      new Promise<SignInState>(resolve => {
        finish = resolve;
      });

    render(<SignInForm action={action} />);
    type('Email', 'a@example.com');
    type('Password', 'x');
    await submit();

    expect(
      screen.getByRole('button', { name: 'Sign in' }).hasAttribute('disabled')
    ).toBe(true);

    await act(async () => finish(undefined));

    expect(
      screen.getByRole('button', { name: 'Sign in' }).hasAttribute('disabled')
    ).toBe(false);
  });
});

describe('on a phone', () => {
  const desktop = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = (() => ({
      addEventListener: () => {},
      matches: true,
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = desktop;
  });

  // NFR-05
  it('is the phone form with the phone title', () => {
    const { container } = render(<SignInForm action={async () => undefined} />);

    expect(container.querySelector('form')?.getAttribute('data-form')).toBe(
      'phone'
    );
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });
});
