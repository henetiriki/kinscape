'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type {
  DetailsShown,
  OtherPerson,
  RelationshipActions,
  RelationshipEntry,
  RelationshipsPerson,
} from '@ks/features/people/components/types';
import type { PersonId } from '@ks/lib/domain/ids/types';
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
import { RelationshipDetails } from '@ks/features/people/components/RelationshipDetails';
import { RelationshipPicker } from '@ks/features/people/components/RelationshipPicker';
import { otherEnd } from '@ks/lib/domain/relationships/groups.mts';

import styles from '@ks/features/people/components/PersonRelationships.module.css';

const GROUPS = [
  { key: 'parents', title: 'Parents' },
  { key: 'spouses', title: 'Spouses' },
  { key: 'children', title: 'Children' },
] as const;

/** The board words a Relationship "link" in the count; the code calls it a Relationship. */
const count = (relationships: number) =>
  `${relationships} ${relationships === 1 ? 'link' : 'links'}`;

/** The entry of `id` and its group, or undefined if no group holds it. */
const findEntry = (
  groups: Record<RelationshipGroup, RelationshipEntry[]> | undefined,
  id: string | undefined
) => {
  for (const { key } of GROUPS) {
    const entry = groups?.[key].find(candidate => candidate.id === id);

    if (entry) {
      return { entry, group: key };
    }
  }
};

/** The other Person of a dialog: a name, the dates and the id of the Person at the other end. */
const otherOf = (from: Omit<OtherPerson, 'id'>, id: string): OtherPerson => ({
  born: from.born,
  bornReading: from.bornReading,
  deceased: from.deceased,
  died: from.died,
  diedReading: from.diedReading,
  givenNames: from.givenNames,
  id,
  surname: from.surname,
});

/**
 * The Relationships page of a Person (PPL-02): three groups of Relationships, or the notice of a
 * load that failed. The subtitle is the name and a save note, with the dates on a line below. A
 * load that failed may have no `person`, so the subtitle is then the save note only. "Add" opens
 * the picker of its group, and a pick opens the details dialog. "Edit" is a link to this page with
 * `?edit={id}`, and the page opens the details dialog of that Relationship. The picker stays
 * mounted after it closes, so the browser returns focus to "Add".
 */
export const PersonRelationships = ({
  actions,
  edit,
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
      actions: RelationshipActions;
      /** The id of the Relationship to edit, from the `edit` search param. */
      edit?: string;
      failed?: false;
      groups: Record<RelationshipGroup, RelationshipEntry[]>;
      /** Every Person of the Tree except `person`, for the picker. */
      people: PersonSummary[];
      person: RelationshipsPerson;
      /**
       * Opens the dialog of a group at the start, for the screen boards: with a filter, or at step 2
       * with a Person picked, a marriage text and a result to show.
       */
      picking?: {
        group: RelationshipGroup;
        marriage?: string;
        picked?: string;
        query?: string;
        shown?: DetailsShown;
      };
    }
  | {
      actions?: undefined;
      edit?: undefined;
      failed: true;
      groups?: undefined;
      people?: undefined;
      person?: RelationshipsPerson;
      picking?: undefined;
    }
)) => {
  const router = useRouter();
  const [adding, setAdding] = useState(picking?.group);
  const [open, setOpen] = useState(picking !== undefined);
  const [opened, setOpened] = useState(0);
  const [picked, setPicked] = useState(() =>
    people?.find(candidate => candidate.id === picking?.picked)
  );
  const query = picking?.query;
  const editing = findEntry(groups, edit);
  const here = person ? `/people/${person.id}/relationships` : '/people';
  // The refresh after a save still holds `?edit`: the dialog stays closed until the address drops it.
  const [closedEdit, setClosedEdit] = useState<string>();

  if (closedEdit && !edit) {
    setClosedEdit(undefined);
  }

  const closeEdit = () => {
    setClosedEdit(edit);
    router.replace(here);
  };

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
                        setPicked(undefined);
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
                    // A click on "Edit" opens the dialog again, even if the address still holds `?edit` from the last close.

                    <ul
                      className={styles.rows}
                      onClickCapture={() => setClosedEdit(undefined)}>
                      {groups[key].map(entry => (
                        <li className={styles.item} key={entry.id}>
                          <RelationshipRow
                            {...entry}
                            href={`${here}?edit=${entry.id}`}
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
            onClose={() => {
              if (!picked) setOpen(false);
            }}
            onPick={other => setPicked(other)}
            open={open && !picked}
            people={people}
          />
        )}
        {adding && picked && !failed && (
          <RelationshipDetails
            actions={actions}
            group={adding}
            key={`${opened}-${picked.id}`}
            onBack={() => setPicked(undefined)}
            onClose={() => setOpen(false)}
            open={open}
            other={otherOf(picked, picked.id)}
            self={person.id}
            shown={picking?.shown}
            startMarriage={picking?.marriage}
          />
        )}
        {editing && !failed && (
          <RelationshipDetails
            actions={actions}
            existing={editing.entry.relationship}
            group={editing.group}
            key={`${editing.entry.id}-${editing.entry.relationship.version}`}
            onClose={closeEdit}
            open={closedEdit !== edit}
            other={otherOf(
              editing.entry,
              // The entry comes from a group of this Person, so `otherEnd` finds an end.

              otherEnd(person.id as PersonId, editing.entry.relationship)![0]
            )}
            self={person.id}
          />
        )}
      </div>
    </EditOnComputer>
  );
};
