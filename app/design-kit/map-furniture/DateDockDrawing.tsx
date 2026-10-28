import type { ReactNode } from 'react';

import { hatchStyle } from '@ks/lib/ui/hatch';

import styles from '@ks/app/design-kit/map-furniture/DateDockDrawing.module.css';

const EPOCHS = [
  '1652',
  '1806',
  '1854',
  '1880',
  '1902',
  '1910',
  '1976',
  '1994',
  'Today',
];
const TICKS = [41.1, 53.9, 60.8, 66.7, 68.8, 86.4, 91.2];
const LABELS: [string, number][] = [
  ['1700', 12.8],
  ['1750', 26.1],
  ['1800', 39.5],
  ['1850', 52.8],
  ['1950', 79.5],
];

const Step = ({ path }: { path: string }) => (
  <span className={styles.step}>
    <svg
      aria-hidden='true'
      fill='none'
      height={16}
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      viewBox='0 0 24 24'
      width={16}>
      <path d={path} />
    </svg>
  </span>
);

const PlayIcon = () => (
  <svg
    aria-hidden='true'
    fill='currentColor'
    height={16}
    viewBox='0 0 24 24'
    width={16}>
    <path d='M7 4.5v15l12.5-7.5z' />
  </svg>
);

const Pills = ({
  items,
  minWidth,
  on,
}: {
  items: string[];
  minWidth: number;
  on: string;
}) => (
  <span className={styles.pills}>
    {items.map(item => (
      <span
        className={styles.pill}
        data-on={item === on || undefined}
        key={item}
        style={{ minWidth }}>
        {item}
      </span>
    ))}
  </span>
);

const Key = ({ children }: { children: ReactNode }) => (
  <span className={styles.key}>{children}</span>
);

/** The desktop dock, drawn as board 08 draws it: the real `DateDock` has no Play, Jump to or contested note yet. */
export const DockDrawing = () => (
  <div
    aria-label='Map date'
    className={styles.dock}
    role='group'
    style={hatchStyle}>
    <div className={styles.firstRow}>
      <span className={styles.steps}>
        <Step path='M15 5l-7 7 7 7' />
        <span className={styles.field}>1901</span>
        <Step path='M9 5l7 7-7 7' />
      </span>
      <Pills items={['Year', 'Month', 'Day']} minWidth={52} on='Year' />
      <span className={styles.contested}>
        <span className={styles.swatch} />2 contested claims on this date
      </span>
      <span className={styles.play}>
        <span className={styles.playButton}>
          <PlayIcon />
          Play
        </span>
        <Pills items={['1', '5', '10']} minWidth={40} on='5' />
        <span className={styles.caption}>yr/s</span>
      </span>
    </div>
    <div className={styles.slider}>
      <span className={styles.track} />
      <span className={styles.contestedYears} />
      {TICKS.map(left => (
        <span className={styles.tick} key={left} style={{ left: `${left}%` }} />
      ))}
      <span className={styles.thumb} />
      <div className={styles.years}>
        <span style={{ left: 0 }}>1652</span>
        {LABELS.map(([label, left]) => (
          <span
            key={label}
            style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
            {label}
          </span>
        ))}
        <span style={{ right: 0 }}>Today</span>
      </div>
    </div>
    <div className={styles.jump}>
      <span className={styles.caption}>Jump to</span>
      {EPOCHS.map(epoch => (
        <span
          className={styles.epoch}
          data-on={epoch === '1902' || undefined}
          key={epoch}>
          {epoch}
        </span>
      ))}
      <span className={`${styles.caption} ${styles.hints}`}>
        <Key>←</Key>
        <Key>→</Key>1 year · with <Key>Shift</Key>×10
      </span>
    </div>
  </div>
);

/** The collapsed phone sheet: grabber, steps either side of the field, round Play, one line of help. */
export const SheetDrawing = () => (
  <div aria-label='Map date' className={styles.sheet} role='group'>
    <span aria-hidden='true' className={styles.grabber}>
      <span className={styles.handle} />
    </span>
    <div className={styles.sheetRow}>
      <Step path='M15 5l-7 7 7 7' />
      <span className={`${styles.field} ${styles.fieldFill}`}>1901</span>
      <Step path='M9 5l7 7-7 7' />
      <span className={styles.round}>
        <PlayIcon />
      </span>
    </div>
    <span className={styles.help}>
      Tap the map to see what a place was part of in 1901.
    </span>
  </div>
);
