import type { Metadata } from 'next';

import { TextLink } from '@/app/components/TextLink';
import { loadAppData } from '@/lib/boundaries/app-data';

import { boardTitle } from '../boards';
import styles from '../inputs/page.module.css';
import kit from '../kit.module.css';
import local from './page.module.css';
import {
  Callouts,
  Dialogs,
  Menus,
  NoticeCards,
  Popups,
  ProgressBars,
  SheetHeaders,
  Surfaces,
} from './sections';

export const metadata: Metadata = { title: boardTitle('surfaces') };

const OTHER_PART = {
  1: {
    href: '/design-kit/surfaces',
    text: 'Part 1: surface, notice card, progress bar, dialog',
  },
  2: {
    href: '/design-kit/surfaces?part=2',
    text: 'Part 2: phone sheet headers, menu, popup, callout',
  },
} as const;

/**
 * Board 07: the surfaces that sit above the map. A desktop shows every section. A phone shows one of
 * two parts: `?part=2` is part 2, anything else part 1, and a link leads to the other.
 */
const SurfacesKit = async ({
  searchParams,
}: {
  searchParams: Promise<{ part?: string | string[] }>;
}) => {
  const part = (await searchParams).part === '2' ? 2 : 1;
  const other = OTHER_PART[part === 1 ? 2 : 1];
  const { sources } = loadAppData();

  return (
    <main className={`${styles.kit} ${local.paged}`} data-part={part}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>
          Style guide · 07
          <span className={`${styles.partOf} ${local.shown}`}>
            {' '}
            · part {part} of 2
          </span>
        </span>
        <h1 className={kit.kitTitle}>Surfaces and overlays</h1>
        <p className={kit.kitLead}>
          The cards, dialogs, sheets, menu, popup and callout that sit above the
          map, from the panel up to the modal dialog.
        </p>
        <p className={styles.note}>
          States not drawn here follow board 04: hover tints, a 2px focus ring,
          disabled colours. A tap target under 44 keeps a 44 × 44 hit area.
        </p>
        <span className={`${styles.otherPart} ${local.shown}`}>
          <TextLink href={other.href}>{other.text}</TextLink>
        </span>
      </header>
      <Surfaces />
      <NoticeCards />
      <ProgressBars />
      <Dialogs sources={sources} />
      <SheetHeaders />
      <Menus sources={sources} />
      <Popups />
      <Callouts />
    </main>
  );
};

export default SurfacesKit;
