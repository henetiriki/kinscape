'use client';

import { useEffect, useId, useState } from 'react';

import type { Source } from '@ks/lib/domain/boundaries/types.ts';

import { Icon } from '@ks/app/components/foundation/Icon';

import styles from '@ks/features/map/components/Credits.module.css';

/** Layers whose sources are credited only while that layer is on. */
export const POLITY_LAYER = 'Polity borders';

/** The sources of everything currently drawn. */
export const sourcesOnScreen = (
  sources: Source[],
  showPolities: boolean
): Source[] =>
  sources.filter(source => showPolities || source.layer !== POLITY_LAYER);

/**
 * The credits line. `collapsible` (desktop) keeps it to one line: a "Credits" button opens the
 * attribution text in a card above the line. A second press, a press outside or Esc closes it.
 * Without it (the phone) the text shows in full.
 */
export const Credits = ({
  collapsible,
  onOpenAttributions,
  showPolities,
  sources,
}: {
  collapsible?: boolean;
  onOpenAttributions: () => void;
  showPolities: boolean;
  sources: Source[];
}) => {
  const [open, setOpen] = useState(false);
  const cardId = useId();
  const credits = [
    ...new Set(
      sourcesOnScreen(sources, showPolities).map(source => source.attribution)
    ),
  ];

  useEffect(() => {
    if (!open) return;

    // A dialog owns its own Esc, so the card stays open behind it.
    const onEsc = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !(
          event.target instanceof Element &&
          event.target.closest('dialog, [role=dialog]')
        )
      )
        setOpen(false);
    };
    const onPressOutside = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-credits]')) setOpen(false);
    };

    document.addEventListener('keydown', onEsc);
    document.addEventListener('pointerdown', onPressOutside);

    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('pointerdown', onPressOutside);
    };
  }, [open]);

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
    <div className={styles.line} data-credits=''>
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
