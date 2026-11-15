'use client';

import { useState } from 'react';

import type { PersonSummary } from '@ks/lib/domain/persons/types';

import { Button } from '@ks/app/components/actions/Button';
import { PickerRow } from '@ks/app/components/actions/PickerRow';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { TextField } from '@ks/app/components/forms/TextField';
import { Dialog } from '@ks/app/components/overlays/Dialog';
import { datesOf } from '@ks/features/people/components/dates';
import { findPeople } from '@ks/lib/domain/persons/list.mts';

import styles from '@ks/features/people/components/RelationshipPicker.module.css';

const TITLES = {
  children: 'Add a child',
  parents: 'Add a parent',
  spouses: 'Add a spouse',
} as const;

/**
 * Step 1 of "Add" on the Relationships page (PPL-02): a dialog that lists the other Persons, with
 * the filter of the People list. A row has no action until step 2 exists (M2.11.4.3). The page
 * mounts the picker when "Add" opens it, so each opening starts with an empty filter.
 * `initialQuery` is for the screen boards.
 */
export const RelationshipPicker = ({
  group,
  initialQuery = '',
  onClose,
  people,
}: {
  group: keyof typeof TITLES;
  initialQuery?: string;
  onClose: () => void;
  /** Every Person of the Tree except the one whose page it is. */
  people: PersonSummary[];
}) => {
  const [query, setQuery] = useState(initialQuery);
  const shown = findPeople(people, query);

  return (
    <Dialog
      onClose={onClose}
      open
      subtitle='Step 1 of 2. Choose the person.'
      title={TITLES[group]}>
      <TextField
        helper='Matches given names, surnames, maiden names and spelling variants.'
        label='Find a person'
        onChange={event => setQuery(event.target.value)}
        type='search'
        value={query}
      />
      {shown.length > 0 && (
        <ul className={styles.rows}>
          {shown.map(({ match, person }) => (
            <li className={styles.item} key={person.id}>
              <PickerRow
                {...datesOf(person)}
                givenNames={person.givenNames}
                maidenName={person.maidenName}
                matchedVariant={match.variant}
                surname={person.surname}
              />
            </li>
          ))}
        </ul>
      )}
      {shown.length === 0 && people.length > 0 && (
        <div className={styles.notice}>
          <NoticeCard
            actions={[
              { label: 'Clear the filter', onClick: () => setQuery('') },
            ]}
            icon='search'
            title={`No one matches “${query.trim()}”`}>
            Check the spelling, or add them first with Add a person.
          </NoticeCard>
        </div>
      )}
      {people.length === 0 && (
        <div className={styles.notice}>
          <NoticeCard
            actions={[{ href: '/people/new', label: 'Add a person' }]}
            icon='people'
            title='No other people in your Tree'>
            Add another person first, then link them here.
          </NoticeCard>
        </div>
      )}
      <div className={styles.actions}>
        <Button onClick={onClose} variant='secondary'>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
};
