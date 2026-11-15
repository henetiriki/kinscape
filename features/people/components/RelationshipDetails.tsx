'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import type {
  AlertCode,
  DetailsShown,
  OtherPerson,
  RelationshipActions,
  RelationshipSaveResult,
} from '@ks/features/people/components/types.ts';
import type {
  Relationship,
  RelationshipGroup,
  RelationshipSaveError,
} from '@ks/lib/domain/relationships/types.ts';

import { Button } from '@ks/app/components/actions/Button';
import { DateText } from '@ks/app/components/actions/DateText';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Toast } from '@ks/app/components/feedback/Toast';
import { Text } from '@ks/app/components/foundation/Text';
import { Dialog } from '@ks/app/components/overlays/Dialog';
import { FuzzyDateField } from '@ks/features/people/components/FuzzyDateField';
import { messageOf } from '@ks/features/people/components/relationship-messages';
import { formatFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { uuidV7 } from '@ks/lib/domain/ids/ids.mts';
import { checkRelationshipInput } from '@ks/lib/domain/relationships/form.mts';

import styles from '@ks/features/people/components/RelationshipDetails.module.css';

const SUBTYPES = [
  { label: 'Biological', value: 'biological' },
  { label: 'Adoptive', value: 'adoptive' },
  { label: 'Step', value: 'step' },
];

/** The title and the line under it, for an edit. The add dialogs have step 2 of 2 as their line. */
const EDIT_TEXT: Record<RelationshipGroup, { line: string; title: string }> = {
  children: { line: 'Change the type.', title: 'Edit child' },
  parents: { line: 'Change the type.', title: 'Edit parent' },
  spouses: { line: 'Change the dates.', title: 'Edit marriage' },
};

const ADD_TITLES: Record<RelationshipGroup, string> = {
  children: 'Add a child',
  parents: 'Add a parent',
  spouses: 'Add a spouse',
};

const TYPE_LABELS: Record<'children' | 'parents', string> = {
  children: 'Type of child',
  parents: 'Type of parent',
};

/** The Relationship that the form holds, as the raw input of the action. */
const inputOf = (
  group: RelationshipGroup,
  ids: { id: string; other: string; self: string },
  values: { divorce: string; marriage: string; subtype: string },
  existing?: Relationship
) => {
  const { divorce, marriage, subtype } = values;

  if (group === 'spouses') {
    // An update keeps the ends in the order of the stored link: the stores match them in order.
    const ends =
      existing?.type === 'spouse'
        ? { personAId: existing.personAId, personBId: existing.personBId }
        : { personAId: ids.self, personBId: ids.other };

    return {
      divorce,
      id: ids.id,
      marriage,
      ...ends,
      type: 'spouse',
    };
  }

  const [parentId, childId] =
    group === 'parents' ? [ids.other, ids.self] : [ids.self, ids.other];

  return { childId, id: ids.id, parentId, subtype, type: 'parent' };
};

/** The values that the form starts with: those of `existing`, or the defaults of an add. */
const startValues = (
  existing?: Relationship
): { divorce: string; marriage: string; subtype: string } => ({
  divorce:
    existing?.type === 'spouse' && existing.divorce
      ? formatFuzzyDate(existing.divorce)
      : '',
  marriage:
    existing?.type === 'spouse' && existing.marriage
      ? formatFuzzyDate(existing.marriage)
      : '',
  subtype: existing?.type === 'parent' ? existing.subtype : 'biological',
});

/**
 * Step 2 of "Add", and the dialog of "Edit", on the Relationships page (PPL-02). It holds the
 * subtype of a parent or child, or the marriage and divorce dates of a spouse. With `existing` it
 * updates and names the version that the page read; without, it creates. The dialog makes its id
 * once, so "Try again" repeats the same create. A refusal or a store error shows in an alert, and
 * any other failure in the error toast. The dialog stays open on both. `onBack` is for "Add" only.
 * `shown` is for the screen boards.
 */
export const RelationshipDetails = ({
  actions,
  existing,
  group,
  onBack,
  onClose,
  open,
  other,
  self,
  shown,
  startMarriage,
}: {
  actions: RelationshipActions;
  /** The Relationship to change. Without it the dialog adds one. */
  existing?: Relationship;
  group: RelationshipGroup;
  onBack?: () => void;
  onClose: () => void;
  open: boolean;
  other: OtherPerson;
  /** The id of the Person whose page it is. */
  self: string;
  shown?: DetailsShown;
  /** Marriage text to start with, for the screen boards. */
  startMarriage?: string;
}) => {
  const router = useRouter();
  const [newId] = useState(() => uuidV7());
  const [values, setValues] = useState(() => ({
    ...startValues(existing),
    ...(startMarriage === undefined ? {} : { marriage: startMarriage }),
  }));
  const [code, setCode] = useState<AlertCode | undefined>(
    shown === 'failed' ? undefined : shown
  );
  // The number of the attempt whose toast shows, or 0. "Try again" starts the next attempt, so its
  // dismiss of the old toast cannot hide the toast of the new one.
  const [failed, setFailed] = useState(shown === 'failed' ? 1 : 0);
  const attempts = useRef(1);
  const [saving, setSaving] = useState(false);
  const name = `${other.givenNames} ${other.surname}`;
  const message = code && messageOf(code, name);

  const fail = (error: RelationshipSaveError, attempt: number) => {
    if (error === 'invalid') {
      setFailed(attempt);
    } else {
      setCode(error);
    }
  };

  const submit = async () => {
    attempts.current += 1;

    const attempt = attempts.current;
    const input = inputOf(
      group,
      { id: existing?.id ?? newId, other: other.id, self },
      values,
      existing
    );
    const checked = checkRelationshipInput(input);

    setCode(undefined);
    setFailed(0);

    if (!checked.ok) {
      fail(checked.error, attempt);

      return;
    }

    setSaving(true);

    let result: RelationshipSaveResult | undefined;

    try {
      result = existing
        ? await actions.update({
            relationship: input,
            version: existing.version,
          })
        : await actions.create(input);
    } catch {
      result = undefined;
    }

    setSaving(false);

    if (result?.ok) {
      onClose();
    } else {
      fail(result ? result.error : 'invalid', attempt);
    }
  };

  const text = existing
    ? EDIT_TEXT[group]
    : {
        line: 'Step 2 of 2. Say how they are linked.',
        title: ADD_TITLES[group],
      };

  return (
    <Dialog
      onClose={onClose}
      open={open}
      subtitle={text.line}
      title={text.title}>
      <form
        className={styles.form}
        noValidate
        onSubmit={event => {
          event.preventDefault();
          void submit();
        }}>
        {message && (
          <div className={styles.alert}>
            <Alert title={message.title} tone='error'>
              {message.line}
            </Alert>
            {message.action === 'Reload' && (
              <Button onClick={() => router.refresh()}>Reload</Button>
            )}
            {message.action === 'Go to People' && (
              <Button href='/people'>Go to People</Button>
            )}
          </div>
        )}
        <div className={styles.other}>
          <Text variant='title'>
            {other.surname}, {other.givenNames}
          </Text>
          <DateText dates={other} />
        </div>
        {group === 'spouses' ? (
          <>
            <FuzzyDateField
              defaultValue={values.marriage}
              helper='For example 1850, ABT 1850 or BET 1850 AND 1855.'
              label='Marriage'
              onInput={event =>
                setValues({ ...values, marriage: event.currentTarget.value })
              }
            />
            <FuzzyDateField
              defaultValue={values.divorce}
              helper='Leave it empty if they did not divorce.'
              label='Divorce'
              onInput={event =>
                setValues({ ...values, divorce: event.currentTarget.value })
              }
            />
          </>
        ) : (
          <Segmented
            label={TYPE_LABELS[group]}
            name='subtype'
            onChange={subtype => setValues({ ...values, subtype })}
            options={SUBTYPES}
            value={values.subtype}
          />
        )}
        <div className={styles.actions}>
          <Button disabled={saving} type='submit' variant='primary'>
            Save
          </Button>
          {onBack ? (
            <Button onClick={onBack}>Back</Button>
          ) : (
            <Button onClick={onClose}>Cancel</Button>
          )}
        </div>
      </form>
      {failed > 0 && (
        <div className={styles.toast}>
          <Toast
            action='Try again'
            onAction={() => void submit()}
            onDismiss={() =>
              setFailed(current => (current === failed ? 0 : current))
            }
            tone='error'>
            {"Couldn't save the link. Your picks are still here."}
          </Toast>
        </div>
      )}
    </Dialog>
  );
};
