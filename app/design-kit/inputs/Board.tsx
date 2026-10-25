import type { CSSProperties, ReactNode } from 'react';

import type { ControlState } from '@/app/components/controls';

import styles from './page.module.css';

// A column of a state matrix: the state a control shows, or Disabled.
export type Column = 'default' | 'disabled' | ControlState;

/** `phoneTitle` is the shorter label a phone shows above each cell. */
type MatrixColumn = { column: Column; phoneTitle?: string; title: string };

const COLUMNS: MatrixColumn[] = [
  { column: 'default', title: 'Default' },
  { column: 'hover', title: 'Hover' },
  { column: 'focus', phoneTitle: 'Focus', title: 'Focus (keyboard)' },
  { column: 'active', title: 'Pressed' },
  { column: 'disabled', title: 'Disabled' },
];

export const stateOf = (column: Column): ControlState | undefined =>
  column === 'default' || column === 'disabled' ? undefined : column;

/** Draws `desktop` on a desktop and `phone` on a phone, where the board says or draws them differently. */
export const ByViewport = ({
  desktop,
  phone,
}: {
  desktop: ReactNode;
  phone: ReactNode;
}) => (
  <>
    <span className={styles.desktopOnly}>{desktop}</span>
    <span className={styles.phoneOnly}>{phone}</span>
  </>
);

/** Drawn on a desktop only. */
export const DesktopOnly = ({ children }: { children: ReactNode }) => (
  <div className={styles.desktopOnly}>{children}</div>
);

/** One section of the board. Part 1 and part 2 are the two phone pages; a desktop shows both. */
export const Section = ({
  children,
  lead,
  part,
  phoneLead,
  title,
}: {
  children: ReactNode;
  lead: string;
  part: 1 | 2;
  /** The lead a phone shows instead. */
  phoneLead?: string;
  title: string;
}) => (
  <section aria-label={title} className={styles.section} data-part={part}>
    <div className={styles.intro}>
      <h2 className={styles.h2}>{title}</h2>
      <p className={styles.lead}>
        {phoneLead ? <ByViewport desktop={lead} phone={phoneLead} /> : lead}
      </p>
    </div>
    {children}
  </section>
);

/** A variant of the component, with the line that says where it is used. */
export const Variant = ({
  caption,
  children,
  desktop,
  phone,
}: {
  caption: ReactNode;
  children: ReactNode;
  /** Drawn on a desktop only: a phone shows the variants that have no flag. */
  desktop?: boolean;
  /** Drawn on a phone only. */
  phone?: boolean;
}) => (
  <figure
    className={styles.variant}
    data-desktop={desktop || undefined}
    data-phone={phone || undefined}>
    <div className={styles.sample}>{children}</div>
    <figcaption className={styles.caption}>{caption}</figcaption>
  </figure>
);

export const Variants = ({ children }: { children: ReactNode }) => (
  <div className={styles.variants}>{children}</div>
);

export const Matrix = ({
  columns = COLUMNS,
  label,
  rows,
}: {
  columns?: MatrixColumn[];
  label: string;
  rows: {
    /** Drawn on a desktop only. */
    desktop?: boolean;
    hint: string;
    /** Every cell is only drawn. */
    inert?: boolean;
    name: string;
    /** The hint a phone shows instead. */
    phoneHint?: string;
    render: (column: Column) => ReactNode;
  }[];
}) => (
  <figure
    aria-label={label}
    className={styles.matrix}
    style={{ '--columns': columns.length } as CSSProperties}>
    <div className={`${styles.row} ${styles.columns}`}>
      <span>Component</span>
      {columns.map(({ title }) => (
        <span key={title}>{title}</span>
      ))}
    </div>
    {rows.map(({ desktop, hint, inert, name, phoneHint, render }) => (
      <div
        className={styles.row}
        data-desktop={desktop || undefined}
        key={name}>
        <span className={styles.name}>
          <span>{name}</span>
          <span className={styles.hint}>
            {phoneHint ? <ByViewport desktop={hint} phone={phoneHint} /> : hint}
          </span>
        </span>
        {columns.map(({ column, phoneTitle, title }) => (
          // Hover, Focus and Pressed are looks, not controls: inert keeps them out of the tab order and the accessibility tree.
          <span
            className={styles.cell}
            inert={inert || stateOf(column) !== undefined}
            key={column}>
            <span aria-hidden='true' className={styles.stateLabel}>
              {phoneTitle ?? title}
            </span>
            {render(column)}
          </span>
        ))}
      </div>
    ))}
  </figure>
);

/** Name, value, token. */
type Measurement = [string, ReactNode, ReactNode];

/** The Measurements table: name, value, token. `wide` draws it full width, with a wider token column. A phone puts the token under "name · value". */
export const Measurements = ({
  label,
  measurements,
  wide,
}: {
  label: string;
  measurements: Measurement[];
  wide?: boolean;
}) => (
  <div className={styles.factsColumn}>
    <h3 className={styles.h3}>Measurements</h3>
    <div
      aria-label={`${label} measurements`}
      className={styles.table}
      data-wide={wide || undefined}
      role='table'>
      {measurements.map(([name, value, token]) => (
        <div className={styles.fact} key={name} role='row'>
          <span className={styles.factName} role='rowheader'>
            {name}
          </span>
          <span role='cell'>{value}</span>
          <span className={styles.token} role='cell'>
            {token}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const Accessibility = ({
  accessibility,
}: {
  accessibility: [string, ReactNode][];
}) => (
  <div className={styles.factsColumn}>
    <h3 className={styles.h3}>Accessibility</h3>
    <dl className={styles.list}>
      {accessibility.map(([name, text]) => (
        <div className={styles.listRow} key={name}>
          <dt className={styles.factName}>{name}</dt>
          <dd className={styles.definition}>{text}</dd>
        </div>
      ))}
    </dl>
  </div>
);

/** The Measurements table and the Accessibility list beside it. */
export const Facts = ({
  accessibility,
  label,
  measurements,
}: {
  accessibility: [string, ReactNode][];
  label: string;
  measurements: Measurement[];
}) => (
  <div className={styles.facts}>
    <Measurements label={label} measurements={measurements} />
    <Accessibility accessibility={accessibility} />
  </div>
);
