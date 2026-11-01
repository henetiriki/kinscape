'use client';

import { useId, useState } from 'react';

import { Button } from '@ks/app/components/actions/Button';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { Alert } from '@ks/app/components/feedback/Alert';
import { TextField } from '@ks/app/components/forms/TextField';
import { Surface } from '@ks/app/components/foundation/Surface';
import { Text } from '@ks/app/components/foundation/Text';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { DateField } from '@ks/features/map';
import { dayOf, MIN_DAY, todayDay } from '@ks/lib/domain/map/map-date';
import { EVENT_ORDER } from '@ks/lib/ui/EventGlyph';

import styles from '@ks/app/screens/add-pin/AddPinPanel.module.css';

const EVENTS = EVENT_ORDER.map(event => ({
  glyph: event,
  label: `${event.charAt(0).toUpperCase()}${event.slice(1)}`,
  value: event,
}));

/**
 * Add a pin, provisional: Person and Place are plain fields until the pickers are designed,
 * the date takes no qualifiers (about, before, between), and Save does nothing. The date field
 * starts on a bad date, as the design shows it.
 */
export const AddPinPanel = () => {
  const phone = usePhone();
  const titleId = useId();
  const fromId = useId();
  const [day, setDay] = useState(() => dayOf(new Date('1901-06-14')));
  const [events, setEvents] = useState(['residence']);

  return (
    <Surface className={styles.panel} level={phone ? 'sheet' : 'raised'}>
      <section
        aria-labelledby={titleId}
        className={styles.form}
        data-form={phone ? 'phone' : 'desktop'}>
        <div className={styles.head}>
          <Text as='h2' id={titleId} variant='h2'>
            Add a pin
          </Text>
        </div>
        <div className={styles.body}>
          <TextField
            defaultValue='Example Person'
            helper='Search the Tree'
            label='Person'
          />
          <TextField
            defaultValue='Example Farm'
            helper='Search a known place, or click the map.'
            label='Place'
            type='search'
          />
          <TextField
            defaultValue='Farm Example, district Example'
            helper='Type it exactly as the record reads.'
            label='Address as recorded'
          />
          <ChipGroup
            label='Event type'
            onToggle={value =>
              setEvents(current =>
                current.includes(value)
                  ? current.filter(event => event !== value)
                  : [...current, value]
              )
            }
            options={EVENTS}
            selected={events}
          />
          <div aria-labelledby={fromId} className={styles.date} role='group'>
            <Text id={fromId} variant='label'>
              From
            </Text>
            <DateField
              day={day}
              defaultText='1901-02-30'
              fill={phone}
              max={todayDay()}
              min={MIN_DAY}
              onChange={setDay}
              precision='day'
            />
          </div>
          <Alert title='Overlaps another residence' tone='warning'>
            Example Person already lives at Example Farm from 1840 to 1855.
          </Alert>
        </div>
        <div className={styles.actions}>
          <Button full={phone} variant='primary'>
            Save pin
          </Button>
          <Button full={phone} variant='secondary'>
            Cancel
          </Button>
        </div>
      </section>
    </Surface>
  );
};
