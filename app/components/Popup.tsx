'use client';

import { type CSSProperties, useId } from 'react';

import { Button } from './Button';
import { EventGlyph, type EventType } from './EventGlyph';
import { Icon } from './Icon';
import styles from './Popup.module.css';
import { Text } from './Text';
import { TextLink } from './TextLink';

/** One level of the Jurisdiction chain; `detail` says what the name was before. */
export type ChainLevel = { detail?: string; level: string; name: string };

export type PopupPin = {
  date: string;
  event: EventType;
  /** The pin's record; a pin without one is plain text. */
  href?: string;
  id: string;
  people: string;
  title: string;
};

/** What Copy chain copies: a line per level, smallest first, as `Colony: Cape Colony (Was … until 1880)`. */
export const chainText = (chain: ChainLevel[]) =>
  chain
    .map(
      ({ detail, level, name }) =>
        `${level}: ${name}${detail ? ` (${detail})` : ''}`
    )
    .join('\n');

type Props = {
  chain: ChainLevel[];
  coordinates: string;
  /** A floating popup on a desktop; a sheet region on a phone. */
  form: 'floating' | 'sheet';
  /** Called by Close and by Esc inside the popup. */
  onClose?: () => void;
  /** Called with whether the chain reached the clipboard; the caller shows the Toast. */
  onCopied?: (ok: boolean) => void;
  pins: PopupPin[];
  place: string;
  year: number;
};

const Pins = ({ pins }: { pins: PopupPin[] }) => (
  <>
    {pins.map(({ date, event, href, id, people, title }) => (
      <div className={styles.pin} key={id}>
        <EventGlyph event={event} />
        <span className={styles.pinText}>
          <span className={styles.pinTitle}>
            {href ? <TextLink href={href}>{title}</TextLink> : title}
          </span>
          <Text variant='small'>{people}</Text>
        </span>
        <Text variant='mono'>{date}</Text>
      </div>
    ))}
  </>
);

/** "What was this spot part of on the map date?": the Jurisdiction chain and the pins there. */
export const Popup = ({
  chain,
  coordinates,
  form,
  onClose,
  onCopied,
  pins,
  place,
  year,
}: Props) => {
  const overlineId = useId();
  const floating = form === 'floating';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(chainText(chain));
      onCopied?.(true);
    } catch {
      onCopied?.(false);
    }
  };

  const header = (
    <div className={styles.header}>
      <Text id={overlineId} variant='overline'>
        On this spot in {year}
      </Text>
      <div className={styles.place}>
        <Text as='h3' variant='h3'>
          {place}
        </Text>
        <Text variant='mono'>{coordinates}</Text>
      </div>
    </div>
  );

  const list = (
    <ol className={styles.chain}>
      {chain.map(({ detail, level, name }) => (
        <li key={level}>
          <Text variant='overline'>{level}</Text>
          <span className={styles.name}>
            <span className={styles.value}>{name}</span>
            {detail && <Text variant='caption'>{detail}</Text>}
          </span>
        </li>
      ))}
    </ol>
  );

  if (!floating) {
    return (
      <section aria-labelledby={overlineId} className={styles.sheet}>
        <span aria-hidden='true' className={styles.handle} />
        {header}
        {list}
        <Pins pins={pins} />
        <Text variant='small'>
          Look-up only on a phone. Add people and pins on a tablet or computer.
        </Text>
      </section>
    );
  }

  return (
    // Esc inside the popup closes it; the popup itself is not a tab stop.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      aria-label='Jurisdiction at this point'
      className={styles.popup}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      }}
      role='dialog'>
      <div className={styles.top}>
        {header}
        <button
          aria-label='Close'
          className={styles.close}
          onClick={onClose}
          type='button'>
          <Icon name='close' size={16} />
        </button>
      </div>
      {list}
      {pins.length > 0 && (
        <div className={styles.inset}>
          <Text variant='overline'>
            {pins.length} {pins.length === 1 ? 'pin' : 'pins'} here
          </Text>
          <Pins pins={pins} />
        </div>
      )}
      <Button icon='copy' onClick={copy} size='xs'>
        Copy chain
      </Button>
    </div>
  );
};

/**
 * The floating Popup at a map point, in pixels from the corner of the overlay area:
 * left of the point, with its pointer on the right edge.
 */
export const PlacedPopup = ({
  x,
  y,
  ...rest
}: { x: number; y: number } & Omit<Parameters<typeof Popup>[0], 'form'>) => (
  <div
    className={styles.placed}
    style={{ '--x': `${x}px`, '--y': `${y}px` } as CSSProperties}>
    <Popup {...rest} form='floating' />
    <PopupPointer className={styles.placedPointer} />
  </div>
);

/** Decoration, never read: a square turned 45°. The caller sets `bottom` and `left` on `className`. */
export const PopupPointer = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={className ? `${styles.pointer} ${className}` : styles.pointer}
  />
);
