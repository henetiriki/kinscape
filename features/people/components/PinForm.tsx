'use client';

import type { FormEvent } from 'react';

import { useEffect, useId, useRef, useState } from 'react';

import type { PinMessages } from '@ks/features/people/components/types.ts';
import type { PersonSummary } from '@ks/lib/domain/persons/types.ts';

import { Button } from '@ks/app/components/actions/Button';
import { Alert } from '@ks/app/components/feedback/Alert';
import { LoadingField } from '@ks/app/components/feedback/LoadingField';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TextAreaField } from '@ks/app/components/forms/TextAreaField';
import { TextField } from '@ks/app/components/forms/TextField';
import { Surface } from '@ks/app/components/foundation/Surface';
import { Text } from '@ks/app/components/foundation/Text';
import { FuzzyDateField } from '@ks/features/people/components/FuzzyDateField';
import { PersonField } from '@ks/features/people/components/PersonField';
import {
  EVENT_OPTIONS,
  pinMessages,
  PRECISION_OPTIONS,
} from '@ks/features/people/components/pin-messages.ts';
import { usePeople } from '@ks/features/people/query';
import { uuidV7 } from '@ks/lib/domain/ids/ids.mts';
import { checkPin } from '@ks/lib/domain/pins/form.mts';
import { parseCoordinates } from '@ks/lib/domain/places/coordinates.mts';

import styles from '@ks/features/people/components/PinForm.module.css';

const DATE_HELPER = 'For example 1850, ABT 1850 or BET 1850 AND 1855.';

/** The loading look of each field, as `pin-edit-loading` draws it: the label and the width of each bar. */
const LOADING_FIELDS = [
  ['Person', [168]],
  ['Event type', [140]],
  ['Date', [150]],
  ['Coordinates', [190]],
  ['Address as recorded', [220]],
  ['Precision', [120]],
  ['Sources', [220, 160]],
  ['Notes', [220, 160]],
] as const;

/** What the form reads from its fields at Save. */
const readFields = (form: HTMLFormElement) => {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name));

  return {
    address: text('address'),
    coordinates: text('coordinates'),
    date: text('date'),
    eventType: text('eventType'),
    notes: text('notes'),
    precision: text('precision'),
    sources: text('sources'),
  };
};

/**
 * The panel that adds a Pin at a new point (PIN-01, PIN-02). It asks for the Persons when it
 * mounts, so a closed panel sends no request. `onSave` gets the input that `checkPin` accepted on
 * the client and says whether the server saved it; `onSaved` runs after a save. The fields stay
 * mounted through a failed save, so they keep their values, and a retry sends the same ids.
 */
export const PinForm = ({
  onCancel,
  onSave,
  onSaved,
}: {
  onCancel: () => void;
  onSave: (input: unknown) => Promise<{ ok: boolean }>;
  onSaved: () => void;
  // eslint-disable-next-line max-lines-per-function -- over 60 lines before the rule (C1174)
}) => {
  const titleId = useId();
  const form = useRef<HTMLFormElement>(null);
  const people = usePeople();
  const [ids] = useState(() => ({ pin: uuidV7(), place: uuidV7() }));
  const [person, setPerson] = useState<PersonSummary>();
  const [messages, setMessages] = useState<PinMessages>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const loading = people.isPending || (people.isError && people.isFetching);
  const loadFailed = people.isError && !people.isFetching;

  // Esc closes the panel only when it starts in the panel, or on the page when no control holds the
  // focus. The dock date field and the Pin popup own an Esc outside the panel, and the Person list
  // prevents the Esc that closes it.
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      const { target } = event;

      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        (target === document.body ||
          (target instanceof Node && form.current!.contains(target)))
      ) {
        onCancel();
      }
    };

    document.addEventListener('keydown', close);

    return () => document.removeEventListener('keydown', close);
  }, [onCancel]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const values = readFields(event.currentTarget);
    const point = parseCoordinates(values.coordinates);
    // A point that does not read still lets `checkPin` check the other fields.
    const raw = {
      address: values.address,
      date: values.date,
      eventType: values.eventType,
      id: ids.pin,
      notes: values.notes,
      personId: person?.id ?? '',
      place: {
        id: ids.place,
        kind: 'new',
        precision: values.precision,
        ...(point.ok ? point.value : { latitude: 0, longitude: 0 }),
      },
      sources: values.sources,
    };
    const checked = checkPin(raw);
    const fields =
      !checked.ok && checked.error !== 'invalid' ? checked.error.fields : {};
    const next = pinMessages(
      fields,
      point.ok ? undefined : point.error,
      values.date
    );

    setMessages(next);

    if (Object.values(next).some(Boolean)) return;

    setFailed(false);
    setSaving(true);

    try {
      const result = checked.ok ? await onSave(raw) : { ok: false };

      if (result.ok) {
        onSaved();

        return;
      }

      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const retry = (
    <Button onClick={() => void people.refetch()} variant='secondary'>
      Try again
    </Button>
  );

  return (
    <Surface className={styles.panel} level='raised'>
      <form
        aria-busy={saving || loading || undefined}
        aria-labelledby={titleId}
        className={styles.form}
        noValidate
        onSubmit={event => void save(event)}
        ref={form}>
        <div className={styles.head}>
          <Text as='h2' id={titleId} variant='h2'>
            Add a pin
          </Text>
        </div>
        <div className={styles.body}>
          {loading ? (
            LOADING_FIELDS.map(([label, widths]) => (
              <LoadingField key={label} label={label} widths={widths} />
            ))
          ) : loadFailed ? (
            <>
              <Alert title="Couldn't load your people" tone='error'>
                The people of your Tree didn&apos;t load.
              </Alert>
              <div className={styles.retry}>{retry}</div>
            </>
          ) : (
            <>
              {failed && (
                <Alert title="Couldn't save the pin" tone='error'>
                  Your values are still here. Try again.
                </Alert>
              )}
              {people.data!.length === 0 ? (
                <div className={styles.none}>
                  <Text variant='label'>Person</Text>
                  <NoticeCard
                    actions={[{ href: '/people/new', label: 'Add a person' }]}
                    icon='people'
                    title='No people yet'>
                    Add a person before you add a pin.
                  </NoticeCard>
                  {messages.personId && (
                    <Text as='p' role='alert' tone='error' variant='small'>
                      {messages.personId}
                    </Text>
                  )}
                </div>
              ) : (
                <PersonField
                  error={messages.personId}
                  onChange={setPerson}
                  people={people.data!}
                />
              )}
              <SelectField
                aria-required='true'
                defaultValue=''
                error={messages.eventType}
                label='Event type'
                name='eventType'
                options={EVENT_OPTIONS}
              />
              <FuzzyDateField
                aria-required='true'
                error={messages.date}
                helper={DATE_HELPER}
                label='Date'
                name='date'
              />
              <TextField
                aria-required='true'
                autoComplete='off'
                error={messages.coordinates}
                helper='In decimal degrees, such as -33.93, 18.42.'
                label='Coordinates'
                name='coordinates'
                spellCheck={false}
              />
              <TextField
                error={messages.address}
                label='Address as recorded'
                name='address'
              />
              <SelectField
                defaultValue='approximate'
                error={messages.precision}
                label='Precision'
                name='precision'
                options={PRECISION_OPTIONS}
              />
              <TextAreaField
                error={messages.sources}
                label='Sources'
                name='sources'
                rows={2}
              />
              <TextAreaField
                error={messages.notes}
                label='Notes'
                name='notes'
                rows={2}
              />
            </>
          )}
        </div>
        <div className={styles.actions}>
          {!loadFailed && (
            <Button
              disabled={saving || loading}
              type='submit'
              variant='primary'>
              Save
            </Button>
          )}
          <Button onClick={onCancel} variant='secondary'>
            Cancel
          </Button>
        </div>
      </form>
    </Surface>
  );
};
