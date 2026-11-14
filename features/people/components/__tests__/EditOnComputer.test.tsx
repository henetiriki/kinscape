import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EditOnComputer } from '@ks/features/people/components/EditOnComputer';

const setup = () =>
  render(
    <EditOnComputer
      email='a@example.test'
      initial='A'
      onSignOut={() => Promise.resolve()}>
      <form aria-label='The form' />
    </EditOnComputer>
  );

// PPL-01
describe('on desktop', () => {
  it('shows the form and no notice', () => {
    setup();
    screen.getByRole('form', { name: 'The form' });
    expect(screen.queryByRole('status')).toBeNull();
  });
});

// NFR-05
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

  it('shows the notice, with no form, and a link to the list', () => {
    setup();
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(
      'Edit people on a computer'
    );
    expect(
      screen.getByRole('link', { name: 'See all people' }).getAttribute('href')
    ).toBe('/people');
    expect(
      screen.getByRole('button', { name: 'Account menu' }).textContent
    ).toBe('A');
  });
});
