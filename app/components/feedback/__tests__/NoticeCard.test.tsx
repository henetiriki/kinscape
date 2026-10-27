import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';

// NFR-06
it('is a status that never takes focus, with its buttons in reading order', () => {
  const calls: string[] = [];

  render(
    <NoticeCard
      actions={[
        { label: 'Jump to 1898', onClick: () => calls.push('jump') },
        { label: 'Clear filters' },
      ]}
      icon='place'
      title='No pins in 1901'>
      Nobody in your filters is pinned to this date.
    </NoticeCard>
  );

  const card = screen.getByRole('status');

  expect(card.hasAttribute('tabindex')).toBe(false);
  expect(card.hasAttribute('aria-live')).toBe(false);
  expect(card.textContent).toBe(
    'No pins in 1901Nobody in your filters is pinned to this date.Jump to 1898Clear filters'
  );
  expect(
    screen.getAllByRole('button').map(button => button.textContent)
  ).toEqual(['Jump to 1898', 'Clear filters']);
  fireEvent.click(screen.getByRole('button', { name: 'Jump to 1898' }));
  expect(calls).toEqual(['jump']);
  expect(screen.queryByRole('progressbar')).toBeNull();
});

it('draws the plain, phone and large forms', () => {
  const { rerender } = render(<NoticeCard title='Title'>Line</NoticeCard>);
  const card = () => screen.getByRole('status');

  expect(card().querySelector('svg')).toBeNull();
  expect(card().querySelector('button')).toBeNull();

  rerender(
    <NoticeCard actions={[{ label: 'Go' }]} phone title='Title'>
      Line
    </NoticeCard>
  );
  expect(card().hasAttribute('data-phone')).toBe(true);

  rerender(
    <NoticeCard icon='place' size='large' title='Title'>
      Line
    </NoticeCard>
  );
  expect(card().getAttribute('data-size')).toBe('large');
  expect(card().querySelector('svg')!.getAttribute('width')).toBe('28');
});

it('announces politely in its loading form and follows the value', () => {
  const { rerender } = render(
    <NoticeCard progress={45} title='Loading the map'>
      Every border loads once.
    </NoticeCard>
  );
  const bar = () =>
    screen.getByRole('progressbar', { name: 'Loading the map' });

  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
  expect(bar().getAttribute('aria-valuenow')).toBe('45');

  rerender(
    <NoticeCard progress={80} title='Loading the map'>
      Every border loads once.
    </NoticeCard>
  );
  expect(bar().getAttribute('aria-valuenow')).toBe('80');
});
