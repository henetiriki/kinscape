'use client';

import type { Source } from '@/lib/domain/boundaries/types.ts';

import styles from '@ks/app/components/map/Credits.module.css';

/** Layers whose sources are credited only while that layer is on. */
export const POLITY_LAYER = 'Polity borders';

/** The sources of everything currently drawn. */
export const sourcesOnScreen = (
  sources: Source[],
  showPolities: boolean
): Source[] =>
  sources.filter(source => showPolities || source.layer !== POLITY_LAYER);

export const Credits = ({
  onOpenAttributions,
  showPolities,
  sources,
}: {
  onOpenAttributions: () => void;
  showPolities: boolean;
  sources: Source[];
}) => {
  const credits = [
    ...new Set(
      sourcesOnScreen(sources, showPolities).map(source => source.attribution)
    ),
  ];

  return (
    <p className={styles.credits}>
      {credits.map(text => `${text} · `)}
      <button onClick={onOpenAttributions} type='button'>
        Attributions
      </button>
    </p>
  );
};
