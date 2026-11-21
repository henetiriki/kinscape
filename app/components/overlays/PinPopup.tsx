'use client';

import type { PinPopupState } from '@ks/app/components/overlays/types';
import type { EventType } from '@ks/lib/ui/types';

import { Button } from '@ks/app/components/actions/Button';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';
import { PlacedAt } from '@ks/app/components/overlays/PlacedAt';
import { PopupPointer } from '@ks/app/components/overlays/Popup';
import { EventGlyph, eventLabel } from '@ks/lib/ui/EventGlyph';

import styles from '@ks/app/components/overlays/PinPopup.module.css';

type PinPopupArgs = {
  /** The address as recorded; the loaded state shows it, and an empty one reads as no address. */
  address?: string;
  /** The Event type of the Pin. */
  event: EventType;
  /** A floating popup on a desktop; a sheet region on a phone; `inline` fills the details of the date sheet. */
  form?: 'floating' | 'inline' | 'sheet';
  /** The Person's name; the loaded state shows it. */
  name?: string;
  /** Called by Close and by Esc inside the floating popup. */
  onClose?: () => void;
  /** Called by "Try again" in the failed state. */
  onRetry?: () => void;
  /** The reading of the date, such as "From 1890 to 1905". */
  reading: string;
  /** The date as recorded, such as "FROM 1890 TO 1905". */
  recorded: string;
  /** Loading and failed show the event type and both date lines only. */
  state: PinPopupState;
};

const Bar = ({ width }: { width: number }) => (
  <span
    aria-hidden='true'
    className={styles.bar}
    data-bar=''
    style={{ width }}
  />
);

/** The popup of a Pin (PIN-02): the Person, the event type, both date lines and the address. */
export const PinPopup = ({
  address,
  event,
  form = 'floating',
  name,
  onClose,
  onRetry,
  reading,
  recorded,
  state,
}: PinPopupArgs) => {
  const floating = form === 'floating';
  const loaded = state === 'loaded';
  const loading = state === 'loading';

  const top = (
    <div className={styles.top}>
      <div className={styles.header}>
        <span className={styles.event}>
          <EventGlyph event={event} />
          <Text variant='overline'>{eventLabel(event)}</Text>
        </span>
        {loaded && (
          <Text as='h3' variant='h3'>
            {name}
          </Text>
        )}
        {loading && <Bar width={168} />}
      </div>
      <span className={styles.close}>
        <IconButton label='Close' onClick={onClose}>
          <Icon name='close' size={20} />
        </IconButton>
      </span>
    </div>
  );
  const dates = (
    <div className={styles.dates}>
      <Text variant='title'>{reading}</Text>
      <Text variant='mono'>{recorded}</Text>
    </div>
  );
  const body = (
    <>
      {state === 'failed' ? (
        <Alert title="Couldn't load this Pin" tone='error'>
          The details didn&apos;t load.
        </Alert>
      ) : (
        <div className={styles.address}>
          <Text variant='overline'>Address as recorded</Text>
          {loading ? (
            <Bar width={220} />
          ) : (
            <Text variant='body'>{address || 'No address recorded'}</Text>
          )}
        </div>
      )}
    </>
  );
  const retry = state === 'failed' && (
    <div className={styles.actions}>
      <Button onClick={onRetry} variant='secondary'>
        Try again
      </Button>
    </div>
  );

  if (!floating) {
    const content = (
      <>
        {top}
        {dates}
        {body}
        {retry}
      </>
    );
    const note = (className: string) =>
      loaded && (
        <p className={className}>
          Look-up only on a phone. Add people and pins on a tablet or computer.
        </p>
      );

    // Inside the date sheet the sheet's own handle and surface are there already, and the note sits at the foot of the sheet.
    return form === 'inline' ? (
      <>
        <div
          aria-busy={loading || undefined}
          aria-label='Pin details'
          className={styles.inline}
          role='group'>
          {content}
        </div>
        {note(`${styles.note} ${styles.foot}`)}
      </>
    ) : (
      <section
        aria-busy={loading || undefined}
        aria-label={`Pin details, ${state}`}
        className={styles.sheet}>
        <span aria-hidden='true' className={styles.handle} />
        {content}
        {note(styles.note)}
      </section>
    );
  }

  return (
    // Esc inside the popup closes it; the popup itself is not a tab stop.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      aria-busy={loading || undefined}
      aria-label='Pin details'
      className={styles.popup}
      onKeyDown={press => {
        if (press.key === 'Escape') {
          onClose?.();
        }
      }}
      role='dialog'>
      <PopupPointer className={styles.pointer} />
      {top}
      {dates}
      {body}
      {retry || (
        <div className={styles.actions}>
          <Button disabled={!loaded} variant='primary'>
            Add a pin here
          </Button>
          <Button disabled={!loaded} variant='secondary'>
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

/** The floating popup at a map point, in pixels from the corner of the overlay area. */
export const PlacedPinPopup = ({
  x,
  y,
  ...rest
}: { x: number; y: number } & Omit<PinPopupArgs, 'form'>) => (
  <PlacedAt gap='pin-popup-gap' x={x} y={y}>
    <PinPopup {...rest} form='floating' />
  </PlacedAt>
);
