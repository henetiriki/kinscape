'use client';

import { useId, useRef, useState } from 'react';

import type { Source } from '@ks/lib/domain/boundaries/types.ts';

import { Icon } from '@ks/app/components/foundation/Icon';
import { useDismiss } from '@ks/app/components/overlays/useDismiss';

import styles from '@ks/features/map/components/Credits.module.css';

/** Layers whose sources are credited only while that layer is on. */
const POLITY_LAYER = 'Polities';

/** The sources of everything currently drawn. */
export const sourcesOnScreen = (
  sources: Source[],
  showPolities: boolean
): Source[] =>
  sources.filter(source => showPolities || source.layer !== POLITY_LAYER);

/**
 * The credits line. `collapsible` (desktop) keeps it to one line: a "Credits" button opens the
 * attribution text in a card above the line. A second press, a press outside or Esc closes it.
 * Without it (the phone) the text shows in full. `defaultOpen` opens the card at the first render:
 * a design board shows the open state with it, and the app does not set it.
 */
export const Credits = ({
  collapsible,
  defaultOpen = false,
  onOpenAttributions,
  showPolities,
  sources,
}: {
  collapsible?: boolean;
  defaultOpen?: boolean;
  onOpenAttributions: () => void;
  showPolities: boolean;
  sources: Source[];
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const cardId = useId();
  const line = useRef<HTMLDivElement>(null);
  const credits = [
    ...new Set(
      sourcesOnScreen(sources, showPolities).map(source => source.attribution)
    ),
  ];

  // A dialog owns its own Esc and presses, so the card stays open behind it.
  useDismiss(open, () => setOpen(false), { escape: true, outside: line });

  const attributions = (
    <button onClick={onOpenAttributions} type='button'>
      Attributions
    </button>
  );

  if (!collapsible) {
    return (
      <p className={styles.credits}>
        {credits.map(text => `${text} · `)}
        {attributions}
      </p>
    );
  }

  return (
    <div className={styles.line} ref={line}>
      <button
        aria-controls={cardId}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        type='button'>
        <Icon name='info' size={14} />
        Credits
      </button>
      <span aria-hidden='true'>·</span>
      {attributions}
      {open && (
        <p className={styles.card} id={cardId}>
          {credits.join(' · ')}
        </p>
      )}
    </div>
  );
};
