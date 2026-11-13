import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ks/server/auth/current.mts', () => ({
  requireDevPage: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { SAMPLE_PEOPLE } from '@ks/app/screens/people';
import Empty from '@ks/app/screens/people-empty/page';
import NoMatch from '@ks/app/screens/people-list-no-match/page';
import List from '@ks/app/screens/people-list/page';
import LoadFailed from '@ks/app/screens/people-load-failed/page';
import { byName } from '@ks/lib/domain/persons/list.mts';

// PPL-01
describe('the People screens', () => {
  it('list twelve synthetic Persons in surname order', async () => {
    render(await List());

    expect(screen.getByRole('status').textContent).toBe(
      '12 people in this Tree, by surname'
    );

    const names = SAMPLE_PEOPLE.toSorted(byName).map(
      ({ givenNames, surname }) => `${surname}, ${givenNames}`
    );

    expect(
      screen
        .getAllByRole('listitem')
        .map((row, at) => row.textContent?.slice(0, names[at]?.length))
    ).toEqual(names);
  });

  it('show the same list for the no-match state, which the check filters', async () => {
    render(await NoMatch());

    expect(screen.getByRole<HTMLInputElement>('searchbox').value).toBe('');
    expect(screen.getAllByRole('listitem')).toHaveLength(SAMPLE_PEOPLE.length);
  });

  it('show the empty notice', async () => {
    render(await Empty());

    expect(screen.getByRole('status').textContent).toContain('No people yet');
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('show the load-failed alert', async () => {
    render(await LoadFailed());

    expect(screen.getByRole('alert').textContent).toContain(
      "People didn't load"
    );
  });
});
