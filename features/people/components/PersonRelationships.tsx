'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people/components/types';
import type { PersonSummary } from '@ks/lib/domain/persons/types';
import type { RelationshipGroup } from '@ks/lib/domain/relationships/types';

import { Button } from '@ks/app/components/actions/Button';
import { DateText } from '@ks/app/components/actions/DateText';
import { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';
import { EditOnComputer } from '@ks/features/people/components/EditOnComputer';
import { RelationshipPicker } from '@ks/features/people/components/RelationshipPicker';

import styles from '@ks/features/people/components/PersonRelationships.module.css';

const GROUPS = [
  { key: 'parents', title: 'Parents' },
  { key: 'spouses', title: 'Spouses' },
  { key: 'children', title: 'Children' },
] as const;

/** The board words a Relationship "link" in the count; the code calls it a Relationship. */
const count = (relationships: number) =>
  `${relationships} ${relationships === 1 ? 'link' : 'links'}`;

/**
 * The Relationships page of a Person (PPL-02): three groups of Relationships, or the notice of a
 * load that failed. The subtitle is the name and a save note, with the dates on a line below. A
 * load that failed may have no `person`, so the subtitle is then the save note only. "Add" opens
 * the picker of its group. The picker has no save. "Edit" points at this page until the edit
 * dialog exists. The picker stays mounted after it closes, so the browser returns focus to "Add".
 */
export const PersonRelationships = ({
  email,
  failed,
  groups,
  initial,
  onSignOut,
  people,
  person,
  picking,
}: {
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
} & (
  | {
      failed: true;
      groups?: undefined;
      people?: undefined;
      person?: RelationshipsPerson;
      picking?: undefined;
    }
  | {
      failed?: false;
      groups: Record<RelationshipGroup, RelationshipEntry[]>;
      /** Every Person of the Tree except `person`, for the picker. */
      people: PersonSummary[];
      person: RelationshipsPerson;
      /** Opens the picker of a group at the start, with a filter. For the screen boards. */
      picking?: { group: RelationshipGroup; query?: string };
    }
)) => {
  const router = useRouter();
  const [adding, setAdding] = useState(picking?.group);
  const [open, setOpen] = useState(picking !== undefined);
  const [opened, setOpened] = useState(0);
  const query = picking?.query;

  return (
    <EditOnComputer email={email} initial={initial} onSignOut={onSignOut}>
      <div className={styles.page}>
        <PageHeader
          avatar={
            <AccountMenu
              email={email}
              initial={initial}
              onSignOut={onSignOut}
            />
          }
          backHref={person ? `/people/${person.id}` : '/people'}
          backLabel={person ? 'Edit person' : 'People'}
        />
        <main className={styles.main}>
          <div className={styles.content}>
            <div className={styles.heading}>
              <Text as='h1' variant='h1'>
                Relationships
              </Text>
              <Text variant='small'>
                {person && (
                  <>
                    <span className={styles.person}>
                      <Text variant='title'>
                        {person.givenNames} {person.surname}
                      </Text>
                    </span>
                    .{' '}
                  </>
                )}
                Each change saves at once.
              </Text>
              {person && <DateText dates={person} />}
            </div>
            {failed ? (
              <div className={styles.failed}>
                <NoticeCard
                  actions={[
                    { label: 'Try again', onClick: () => router.refresh() },
                  ]}
                  icon='cloudOff'
                  size='large'
                  title="Relationships didn't load">
                  Check your connection, then try again. Nothing in your Tree
                  has changed.
                </NoticeCard>
              </div>
            ) : (
              GROUPS.map(({ key, title }) => (
                <section
                  aria-labelledby={`relationships-${key}`}
                  className={styles.group}
                  key={key}>
                  <div className={styles.head}>
                    <div className={styles.title}>
                      <Text as='h2' id={`relationships-${key}`} variant='h3'>
                        {title}
                      </Text>
                      <Text variant='small'>{count(groups[key].length)}</Text>
                    </div>
                    <Button
                      onClick={() => {
                        setAdding(key);
                        setOpen(true);
                        setOpened(times => times + 1);
                      }}
                      variant='secondary'>
                      Add
                    </Button>
                  </div>
                  {groups[key].length === 0 ? (
                    <div className={styles.none}>
                      <Text variant='body'>No {key} yet.</Text>
                    </div>
                  ) : (
                    <ul className={styles.rows}>
                      {groups[key].map(({ id, ...link }) => (
                        <li className={styles.item} key={id}>
                          <RelationshipRow
                            {...link}
                            href={`/people/${person.id}/relationships`}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))
            )}
          </div>
        </main>
        {adding && !failed && (
          <RelationshipPicker
            group={adding}
            initialQuery={query}
            key={opened}
            onClose={() => setOpen(false)}
            open={open}
            people={people}
          />
        )}
      </div>
    </EditOnComputer>
  );
};
