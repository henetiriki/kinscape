'use client';

import type { ReactNode } from 'react';

import type { PinPopupState } from '@ks/app/components/overlays/types';
import type { EventType } from '@ks/lib/ui/types';

import { Button } from '@ks/app/components/actions/Button';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { Alert } from '@ks/app/components/feedback/Alert';
import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';
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
  /** "Add a pin here" in the floating popup calls it. */
  onAddHere?: () => void;
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

/** The top row of a popup: its header column and Close, 8px up and right. `ClickPopup` shares it. */
export const PopupTop = ({
  children,
  onClose,
}: { children: ReactNode } & Pick<PinPopupArgs, 'onClose'>) => (
  <div className={styles.top}>
    <div className={styles.header}>{children}</div>
    <span className={styles.close}>
      <IconButton label='Close' onClick={onClose}>
        <Icon name='close' size={20} />
      </IconButton>
    </span>
  </div>
);

const Top = ({
  event,
  loaded,
  loading,
  name,
  onClose,
}: {
  loaded: boolean;
  loading: boolean;
} & Pick<PinPopupArgs, 'event' | 'name' | 'onClose'>) => (
  <PopupTop onClose={onClose}>
    <span className={styles.event}>
      <EventGlyph event={event} />
      <Text variant='overline'>{eventLabel(event)}</Text>
    </span>
    {loaded && (
      <Text as='h3' variant='h3'>
        {name}
      </Text>
    )}
    {loading && <LoadingBar width={168} />}
  </PopupTop>
);

const Dates = ({
  reading,
  recorded,
}: Pick<PinPopupArgs, 'reading' | 'recorded'>) => (
  <div className={styles.dates}>
    <Text variant='title'>{reading}</Text>
    <Text variant='mono'>{recorded}</Text>
  </div>
);

const Body = ({ address, state }: Pick<PinPopupArgs, 'address' | 'state'>) =>
  state === 'failed' ? (
    <Alert title="Couldn't load this Pin" tone='error'>
      The details didn&apos;t load.
    </Alert>
  ) : (
    <div className={styles.address}>
      <Text variant='overline'>Address as recorded</Text>
      {state === 'loading' ? (
        <LoadingBar width={220} />
      ) : (
        <Text variant='body'>{address || 'No address recorded'}</Text>
      )}
    </div>
  );

const Actions = ({
  floating,
  loaded,
  onAddHere,
  onRetry,
  state,
}: {
  floating: boolean;
  loaded: boolean;
} & Pick<PinPopupArgs, 'onAddHere' | 'onRetry' | 'state'>) => {
  if (state === 'failed') {
    return (
      <div className={styles.actions}>
        <Button onClick={onRetry} variant='secondary'>
          Try again
        </Button>
      </div>
    );
  }

  return (
    floating && (
      <div className={styles.actions}>
        <Button disabled={!loaded} onClick={onAddHere} variant='primary'>
          Add a pin here
        </Button>
        <Button disabled={!loaded} variant='secondary'>
          Edit
        </Button>
      </div>
    )
  );
};

/** The frame of a floating popup: the surface, the pointer and Esc. `ClickPopup` shares it. */
export const Floating = ({
  children,
  label,
  loading = false,
  onClose,
}: {
  children: ReactNode;
  /** The dialog name. */
  label: string;
  loading?: boolean;
} & Pick<PinPopupArgs, 'onClose'>) => (
  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Esc inside the popup closes it; the popup itself is not a tab stop
  <div
    aria-busy={loading || undefined}
    aria-label={label}
    className={styles.popup}
    onKeyDown={press => {
      if (press.key === 'Escape') {
        onClose?.();
      }
    }}
    role='dialog'>
    <PopupPointer className={styles.pointer} />
    {children}
  </div>
);

const Note = ({ className, loaded }: { className: string; loaded: boolean }) =>
  loaded && (
    <p className={className}>
      Look-up only on a phone. Add people and pins on a tablet or computer.
    </p>
  );

// Inside the date sheet the sheet's own handle and surface are there already, and the note sits at the foot of the sheet.
const Docked = ({
  children,
  form,
  loaded,
  state,
}: {
  children: ReactNode;
  loaded: boolean;
} & Pick<PinPopupArgs, 'form' | 'state'>) =>
  form === 'inline' ? (
    <>
      <div
        aria-busy={state === 'loading' || undefined}
        aria-label='Pin details'
        className={styles.inline}
        role='group'>
        {children}
      </div>
      <Note className={`${styles.note} ${styles.foot}`} loaded={loaded} />
    </>
  ) : (
    <section
      aria-busy={state === 'loading' || undefined}
      aria-label={`Pin details, ${state}`}
      className={styles.sheet}>
      <span aria-hidden='true' className={styles.handle} data-testid='handle' />
      {children}
      <Note className={styles.note} loaded={loaded} />
    </section>
  );

/** The popup of a Pin (PIN-02): the Person, the event type, both date lines and the address. */
export const PinPopup = ({
  address,
  event,
  form = 'floating',
  name,
  onAddHere,
  onClose,
  onRetry,
  reading,
  recorded,
  state,
}: PinPopupArgs) => {
  const loaded = state === 'loaded';
  const loading = state === 'loading';

  const top = (
    <Top
      event={event}
      loaded={loaded}
      loading={loading}
      name={name}
      onClose={onClose}
    />
  );
  const details = (
    <>
      <Dates reading={reading} recorded={recorded} />
      <Body address={address} state={state} />
    </>
  );
  const floating = form === 'floating';
  const actions = (
    <Actions
      floating={floating}
      loaded={loaded}
      onAddHere={onAddHere}
      onRetry={onRetry}
      state={state}
    />
  );

  if (!floating) {
    return (
      <Docked form={form} loaded={loaded} state={state}>
        {top}
        {details}
        {actions}
      </Docked>
    );
  }

  return (
    <Floating label='Pin details' loading={loading} onClose={onClose}>
      {top}
      {details}
      {actions}
    </Floating>
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
