'use client';

import { useRouter } from 'next/navigation';

import type {
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people/components/types';

import { Button } from '@ks/app/components/actions/Button';
import { DateText } from '@ks/app/components/actions/DateText';
import { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';
import { EditOnComputer } from '@ks/features/people/components/EditOnComputer';

import styles from '@ks/features/people/components/PersonRelationships.module.css';

const GROUPS = [
  { key: 'parents', title: 'Parents' },
  { key: 'children', title: 'Children' },
  { key: 'spouses', title: 'Spouses' },
] as const;

const count = (links: number) => `${links} ${links === 1 ? 'link' : 'links'}`;

/**
 * The Relationships page of a Person (PPL-02): three groups of links, or the notice of a load that
 * failed. A load that failed may have no `person`, so the subtitle is then the second sentence
 * only. "Add" does nothing yet. "Edit" points at this page until the edit dialog exists.
 */
export const PersonRelationships = ({
  email,
  failed,
  groups,
  initial,
  onSignOut,
  person,
}: {
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
} & (
  | { failed: true; groups?: undefined; person?: RelationshipsPerson }
  | {
      failed?: false;
      groups: Record<(typeof GROUPS)[number]['key'], RelationshipEntry[]>;
      person: RelationshipsPerson;
    }
)) => {
  const router = useRouter();

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
                    {person.givenNames} {person.surname},{' '}
                    <span className={styles.dates}>
                      <DateText dates={person} />
                    </span>
                    .{' '}
                  </>
                )}
                Each change saves at once.
              </Text>
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
                    <Button variant='secondary'>Add</Button>
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
      </div>
    </EditOnComputer>
  );
};
