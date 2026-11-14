import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { PersonNotFound } from '@ks/features/people/components/PersonNotFound';

// PPL-01
it('says the person was not found and links to the list', () => {
  render(
    <PersonNotFound
      email='a@example.test'
      initial='A'
      onSignOut={() => Promise.resolve()}
    />
  );

  expect(screen.getByText('Person not found')).toBeTruthy();
  expect(
    screen.getByText(
      'No one in your Tree has this address. The person may have been deleted, or the link is wrong.'
    )
  ).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'Go to People' }).getAttribute('href')
  ).toBe('/people');
  expect(
    screen.getByRole('link', { name: 'People' }).getAttribute('href')
  ).toBe('/people');
});
