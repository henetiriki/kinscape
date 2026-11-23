'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type {
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
import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
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

type PersonRelationshipsProps = {
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
    }
  | {
      actions?: undefined;
      edit?: undefined;
      failed: true;
      groups?: undefined;
      people?: undefined;
      person?: RelationshipsPerson;
    }
);

const useRelationshipsState = (
  groups: PersonRelationshipsProps['groups'],
  edit: string | undefined,
  personId: string | undefined
) => {
  const router = useRouter();
  const [adding, setAdding] = useState<RelationshipGroup>();
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(0);
  const [picked, setPicked] = useState<PersonSummary>();
  const editing = findEntry(groups, edit);
  const here = personId ? `/people/${personId}/relationships` : '/people';
  // The refresh after a save still holds `?edit`: the dialog stays closed until the address drops it.
  const [closedEdit, setClosedEdit] = useState<string>();

  if (closedEdit && !edit) {
    setClosedEdit(undefined);
  }

  const closeEdit = () => {
    setClosedEdit(edit);
    router.replace(here);
  };

  const add = (key: RelationshipGroup) => {
    setAdding(key);
    setPicked(undefined);
    setOpen(true);
    setOpened(times => times + 1);
  };

  return {
    add,
    adding,
    closedEdit,
    closeEdit,
    editing,
    here,
    open,
    opened,
    picked,
    setClosedEdit,
    setOpen,
    setPicked,
  };
};

type State = ReturnType<typeof useRelationshipsState>;

const Heading = ({ person }: { person?: RelationshipsPerson }) => (
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
);

const Failed = () => {
  const router = useRouter();

  return (
    <div className={styles.failed}>
      <NoticeCard
        actions={[{ label: 'Try again', onClick: () => router.refresh() }]}
        icon='cloudOff'
        size='large'
        title="Relationships didn't load">
        Check your connection, then try again. Nothing in your Tree has changed.
      </NoticeCard>
    </div>
  );
};

const Rows = ({
  entries,
  here,
  name,
  setClosedEdit,
}: {
  entries: RelationshipEntry[];
  here: string;
  name: string;
  setClosedEdit: State['setClosedEdit'];
}) =>
  entries.length === 0 ? (
    <div className={styles.none}>
      <Text variant='body'>No {name} yet.</Text>
    </div>
  ) : (
    // A click on "Edit" opens the dialog again, even if the address still holds `?edit` from the last close.

    <ul className={styles.rows} onClickCapture={() => setClosedEdit(undefined)}>
      {entries.map(entry => (
        <li className={styles.item} key={entry.id}>
          <RelationshipRow {...entry} href={`${here}?edit=${entry.id}`} />
        </li>
      ))}
    </ul>
  );

const Groups = ({
  groups,
  s,
}: {
  groups: Record<RelationshipGroup, RelationshipEntry[]>;
  s: State;
}) =>
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
        <Button onClick={() => s.add(key)} variant='secondary'>
          Add
        </Button>
      </div>
      <Rows
        entries={groups[key]}
        here={s.here}
        name={key}
        setClosedEdit={s.setClosedEdit}
      />
    </section>
  ));

const Dialogs = ({
  actions,
  edit,
  people,
  person,
  s,
}: {
  actions: RelationshipActions;
  edit?: string;
  people: PersonSummary[];
  person: RelationshipsPerson;
  s: State;
}) => {
  const { adding, closedEdit, editing, opened, picked } = s;

  return (
    <>
      {adding && (
        <RelationshipPicker
          group={adding}
          key={opened}
          onClose={() => {
            if (!picked) s.setOpen(false);
          }}
          onPick={other => s.setPicked(other)}
          open={s.open && !picked}
          people={people}
        />
      )}
      {adding && picked && (
        <RelationshipDetails
          actions={actions}
          group={adding}
          key={`${opened}-${picked.id}`}
          onBack={() => s.setPicked(undefined)}
          onClose={() => s.setOpen(false)}
          open={s.open}
          other={otherOf(picked, picked.id)}
          self={person.id}
        />
      )}
      {editing && (
        <RelationshipDetails
          actions={actions}
          existing={editing.entry.relationship}
          group={editing.group}
          key={`${editing.entry.id}-${editing.entry.relationship.version}`}
          onClose={s.closeEdit}
          open={closedEdit !== edit}
          other={otherOf(
            editing.entry,
            // The entry comes from a group of this Person, so `otherEnd` finds an end.

            otherEnd(person.id as PersonId, editing.entry.relationship)![0]
          )}
          self={person.id}
        />
      )}
    </>
  );
};

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
}: PersonRelationshipsProps) => {
  const s = useRelationshipsState(groups, edit, person?.id);

  return (
    <EditOnComputer email={email} initial={initial} onSignOut={onSignOut}>
      <ColumnLayout
        column='detail'
        header={
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
        }>
        <Heading person={person} />
        {failed ? <Failed /> : <Groups groups={groups} s={s} />}
        {!failed && (
          <Dialogs
            actions={actions}
            edit={edit}
            people={people}
            person={person}
            s={s}
          />
        )}
      </ColumnLayout>
    </EditOnComputer>
  );
};
