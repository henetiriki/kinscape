import type { Metadata } from 'next';

import { boardTitle } from '../boards';
import styles from '../inputs/page.module.css';
import kit from '../kit.module.css';
import {
  EventGlyphs,
  Legends,
  MapControls,
  SearchBars,
  Wordmarks,
} from './sections';

export const metadata: Metadata = { title: boardTitle('map-furniture') };

/** Board 08: the pieces that live on the map. A phone shows the same sections, minus the desktop-only samples. */
const MapFurnitureKit = () => (
  <main className={styles.kit} data-part={1}>
    <header className={kit.kitHeader}>
      <span className={kit.kitEyebrow}>Style guide · 08</span>
      <h1 className={kit.kitTitle}>Map furniture</h1>
      <p className={kit.kitLead}>
        The pieces that live on the map itself: the wordmark, search bar, map
        controls, event glyphs and the legend.
      </p>
      <p className={styles.note}>
        States not drawn here follow board 04: hover tints, a 2px focus ring,
        disabled colours. A tap target under 44 keeps a 44 × 44 hit area.
      </p>
    </header>
    <Wordmarks />
    <SearchBars />
    <MapControls />
    <EventGlyphs />
    <Legends />
  </main>
);

export default MapFurnitureKit;
