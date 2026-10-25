import type { Metadata } from 'next';

import { TextLink } from '@/app/components/actions/TextLink';

import { boardTitle } from '../boards';
import styles from '../inputs/page.module.css';
import kit from '../kit.module.css';
import {
  DateDocks,
  EventGlyphs,
  Legends,
  MapControls,
  SearchBars,
  Wordmarks,
} from './sections';

export const metadata: Metadata = { title: boardTitle('map-furniture') };

const OTHER_PART = {
  1: {
    href: '/design-kit/map-furniture',
    text: 'Part 1: wordmark, search bar, map controls',
  },
  2: {
    href: '/design-kit/map-furniture?part=2',
    text: 'Part 2: event glyphs, legend, date dock',
  },
} as const;

/**
 * Board 08: the pieces that live on the map. A desktop shows every section. A phone shows one of two
 * parts: `?part=2` is part 2, anything else part 1, and a link leads to the other.
 */
const MapFurnitureKit = async ({
  searchParams,
}: {
  searchParams: Promise<{ part?: string | string[] }>;
}) => {
  const part = (await searchParams).part === '2' ? 2 : 1;
  const other = OTHER_PART[part === 1 ? 2 : 1];

  return (
    <main className={styles.kit} data-part={part}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>
          Style guide · 08
          <span className={styles.partOf}> · part {part} of 2</span>
        </span>
        <h1 className={kit.kitTitle}>Map furniture</h1>
        <p className={kit.kitLead}>
          The pieces that live on the map itself: the wordmark, search bar, map
          controls, event glyphs, the legend and the date dock.
        </p>
        <p className={styles.note}>
          States not drawn here follow board 04: hover tints, a 2px focus ring,
          disabled colours. A tap target under 44 keeps a 44 × 44 hit area.
        </p>
        <span className={styles.otherPart}>
          <TextLink href={other.href}>{other.text}</TextLink>
        </span>
      </header>
      <Wordmarks />
      <SearchBars />
      <MapControls />
      <EventGlyphs />
      <Legends />
      <DateDocks />
    </main>
  );
};

export default MapFurnitureKit;
