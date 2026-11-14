'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { SaveResult } from '@ks/features/people/components/types.ts';
import type {
  PersonFieldErrors,
  PersonView,
} from '@ks/lib/domain/persons/types.ts';

import { ActionBar } from '@ks/app/components/actions/ActionBar';
import { Button } from '@ks/app/components/actions/Button';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Toast } from '@ks/app/components/feedback/Toast';
import { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TextAreaField } from '@ks/app/components/forms/TextAreaField';
import { TextField } from '@ks/app/components/forms/TextField';
import { TokenField } from '@ks/app/components/forms/TokenField';
import { PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Text } from '@ks/app/components/foundation/Text';
import { AccountMenu } from '@ks/features/people/components/AccountMenu';
import { FuzzyDateField } from '@ks/features/people/components/FuzzyDateField';
import { useSavedToast } from '@ks/features/people/components/SavedToast';
import { formatFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { uuidV7 } from '@ks/lib/domain/ids/ids.mts';
import {
  checkPerson,
  personFieldMessages,
} from '@ks/lib/domain/persons/form.mts';

import styles from '@ks/features/people/components/PersonForm.module.css';

const SEX = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Intersex', value: 'X' },
  { label: 'Unknown', value: 'U' },
];

const MAX_NAME = 200;
const MAX_NOTES = 10_000;

type Name = 'givenNames' | 'surname';

type Values = {
  birth: string;
  death: string;
  deceased: boolean;
  givenNames: string;
  maidenName: string;
  notes: string;
  sex: string;
  surname: string;
  variants: string[];
};

const startValues = (person?: PersonView): Values => ({
  birth: person?.birth ? formatFuzzyDate(person.birth) : '',
  death: person?.death ? formatFuzzyDate(person.death) : '',
  deceased: person?.deceased ?? false,
  givenNames: person?.givenNames ?? '',
  maidenName: person?.maidenName ?? '',
  notes: person?.notes ?? '',
  sex: person?.sex ?? 'U',
  surname: person?.surname ?? '',
  variants: person?.variants ?? [],
});

const without = (
  errors: PersonFieldErrors['fields'],
  field: keyof PersonFieldErrors['fields']
): PersonFieldErrors['fields'] =>
  Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field));

const fixing = (count: number) =>
  count === 1 ? '1 field needs fixing' : `${count} fields need fixing`;

/**
 * The Person form (PPL-01) for `/people/new` and `/people/{id}`. With no `person` it creates; with
 * one it updates and names the version it read. `create` and `update` are server actions. A new
 * form makes its id once, so Try again repeats the same create.
 */
export const PersonForm = ({
  create,
  email,
  initial,
  onSignOut,
  person,
  update,
}: {
  create: (input: unknown) => Promise<SaveResult>;
  email: string;
  initial: string;
  onSignOut: () => Promise<unknown>;
  person?: PersonView;
  update: (input: { person: unknown; version: number }) => Promise<SaveResult>;
}) => {
  const router = useRouter();
  const showSaved = useSavedToast();
  const [newId] = useState(() => uuidV7());
  const [values, setValues] = useState(() => startValues(person));
  const [errors, setErrors] = useState<PersonFieldErrors['fields']>({});
  const [conflict, setConflict] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  // A name field shows "required" on blur only after the user typed in it.
  const [edited, setEdited] = useState<Name[]>([]);
  const dead = values.death.trim() !== '';
  const messages = personFieldMessages(errors, {
    birth: values.birth,
    death: values.death,
  });
  const count = Object.keys(errors).length;

  const set = (next: Partial<Values>) => setValues({ ...values, ...next });

  const name = (field: Name) => ({
    'aria-required': true,
    error: messages[field],
    maxLength: MAX_NAME,
    onBlur: () => {
      if (edited.includes(field) && values[field].trim() === '') {
        setErrors({ ...errors, [field]: 'required' });
      }
    },
    onChange: (event: { target: { value: string } }) => {
      const { value } = event.target;

      setEdited([...edited, field]);
      set({ [field]: value });

      if (value.trim() !== '') {
        setErrors(without(errors, field));
      }
    },
    value: values[field],
  });

  const submit = async () => {
    const input = {
      ...values,
      deceased: values.deceased || dead,
      id: person?.id ?? newId,
    };
    const checked = checkPerson(input);

    if (!checked.ok) {
      if (checked.error === 'invalid') {
        setFailed(true);
      } else {
        setErrors(checked.error.fields);
      }

      return;
    }

    setErrors({});
    setConflict(false);
    setFailed(false);
    setSaving(true);

    let result: SaveResult | undefined;

    try {
      result = person
        ? await update({ person: input, version: person.version })
        : await create(input);
    } catch {
      result = undefined;
    }

    setSaving(false);

    if (result?.ok) {
      showSaved(`Saved ${result.value.givenNames} ${result.value.surname}.`);
      router.push('/people');
    } else if (result?.error === 'conflict') {
      setConflict(true);
    } else if (typeof result?.error === 'object') {
      setErrors(result.error.fields);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        avatar={
          <AccountMenu email={email} initial={initial} onSignOut={onSignOut} />
        }
        backHref='/people'
        backLabel='People'
      />
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.heading}>
            <Text as='h1' variant='h1'>
              {person
                ? `Edit ${person.givenNames} ${person.surname}`
                : 'Add a person'}
            </Text>
            <Text variant='small'>
              Given names and surname are required. Everything else can wait.
            </Text>
          </div>
          {count > 0 && (
            <div className={styles.alert}>
              <Alert title={fixing(count)} tone='error'>
                Nothing was saved. Each problem is marked at its field.
              </Alert>
            </div>
          )}
          {conflict && (
            <div className={styles.alert}>
              <Alert
                title='This person changed while you were editing'
                tone='error'>
                Nothing was saved. Reload to see the latest version, then make
                your changes again.
              </Alert>
              <Button onClick={() => router.refresh()}>Reload</Button>
            </div>
          )}
          <form
            className={styles.card}
            id='person-form'
            noValidate
            onSubmit={event => {
              event.preventDefault();
              void submit();
            }}>
            <div
              aria-labelledby='person-group-name'
              className={styles.group}
              data-column='1'
              role='group'>
              <Text id='person-group-name' variant='title'>
                Name
              </Text>
              <TextField
                autoComplete='off'
                label='Given names'
                {...name('givenNames')}
              />
              <TextField
                autoComplete='off'
                label='Surname'
                {...name('surname')}
              />
              <TextField
                autoComplete='off'
                helper='Surname at birth, if it changed.'
                label='Maiden name'
                maxLength={MAX_NAME}
                onChange={event => set({ maidenName: event.target.value })}
                value={values.maidenName}
              />
              <TokenField
                error={messages.variants}
                helper='Other spellings in the records, up to 20. Press Enter after each.'
                label='Spelling variants'
                onChange={variants => {
                  set({ variants });
                  setErrors(without(errors, 'variants'));
                }}
                placeholder='Add a spelling'
                values={values.variants}
              />
            </div>
            <div
              aria-labelledby='person-group-life'
              className={styles.group}
              data-column='2'
              role='group'>
              <Text id='person-group-life' variant='title'>
                Life
              </Text>
              <SelectField
                label='Sex'
                onChange={event => set({ sex: event.target.value })}
                options={SEX}
                value={values.sex}
              />
              <FuzzyDateField
                defaultValue={values.birth}
                helper='For example 1850, ABT 1850 or BET 1850 AND 1855.'
                label='Birth'
                onInput={event => set({ birth: event.currentTarget.value })}
              />
              <FuzzyDateField
                defaultValue={values.death}
                helper="Leave it empty if you don't know."
                label='Death'
                onInput={event => set({ death: event.currentTarget.value })}
              />
              <CheckboxField
                checked={values.deceased || dead}
                description={
                  dead
                    ? 'Ticked because a death date is entered.'
                    : "Tick if this person has died but the date isn't known."
                }
                disabled={dead}
                label='Deceased'
                onChange={event => set({ deceased: event.target.checked })}
              />
            </div>
            <div className={styles.notes}>
              <TextAreaField
                helper="Sources, stories, anything the fields can't hold."
                label='Notes'
                maxLength={MAX_NOTES}
                onChange={event => set({ notes: event.target.value })}
                value={values.notes}
              />
            </div>
          </form>
        </div>
      </main>
      {failed && (
        <div className={styles.toast}>
          <Toast
            action='Try again'
            onAction={() => void submit()}
            onDismiss={() => setFailed(false)}
            tone='error'>
            {"Couldn't save. Your changes are still here."}
          </Toast>
        </div>
      )}
      <ActionBar>
        <Button
          disabled={saving}
          form='person-form'
          type='submit'
          variant='primary'>
          Save
        </Button>
        <Button href='/people'>Cancel</Button>
      </ActionBar>
    </div>
  );
};
