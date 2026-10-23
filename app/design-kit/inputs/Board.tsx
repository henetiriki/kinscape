import type { ReactNode } from 'react';

import type { ControlState } from '@/app/components/controls';

import styles from './page.module.css';

// A column of a state matrix: the state a control shows, or Disabled.
export type Column = 'default' | 'disabled' | ControlState;

const COLUMNS: { column: Column; title: string }[] = [
  { column: 'default', title: 'Default' },
  { column: 'hover', title: 'Hover' },
  { column: 'focus', title: 'Focus (keyboard)' },
  { column: 'active', title: 'Pressed' },
  { column: 'disabled', title: 'Disabled' },
];

export const stateOf = (column: Column): ControlState | undefined =>
  column === 'default' || column === 'disabled' ? undefined : column;

/** One section of the board. Part 1 and part 2 are the two phone pages; a desktop shows both. */
export const Section = ({
  children,
  lead,
  part,
  title,
}: {
  children: ReactNode;
  lead: string;
  part: 1 | 2;
  title: string;
}) => (
  <section aria-label={title} className={styles.section} data-part={part}>
    <div className={styles.intro}>
      <h2 className={styles.h2}>{title}</h2>
      <p className={styles.lead}>{lead}</p>
    </div>
    {children}
  </section>
);

/** A variant of the component, with the line that says where it is used. */
export const Variant = ({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) => (
  <figure className={styles.variant}>
    <div className={styles.sample}>{children}</div>
    <figcaption className={styles.caption}>{caption}</figcaption>
  </figure>
);

export const Variants = ({ children }: { children: ReactNode }) => (
  <div className={styles.variants}>{children}</div>
);

export const Matrix = ({
  label,
  rows,
}: {
  label: string;
  rows: { hint: string; name: string; render: (column: Column) => ReactNode }[];
}) => (
  <figure aria-label={label} className={styles.matrix}>
    <div className={`${styles.row} ${styles.columns}`}>
      <span>Component</span>
      {COLUMNS.map(({ title }) => (
        <span key={title}>{title}</span>
      ))}
    </div>
    {rows.map(({ hint, name, render }) => (
      <div className={styles.row} key={name}>
        <span className={styles.name}>
          <span>{name}</span>
          <span className={styles.hint}>{hint}</span>
        </span>
        {COLUMNS.map(({ column, title }) => (
          // Hover, Focus and Pressed are looks, not controls: inert keeps them out of the tab order and the accessibility tree.
          <span
            className={styles.cell}
            inert={stateOf(column) !== undefined}
            key={column}>
            <span aria-hidden='true' className={styles.stateLabel}>
              {title}
            </span>
            {render(column)}
          </span>
        ))}
      </div>
    ))}
  </figure>
);

/** The Measurements table (name, value, token) and the Accessibility list beside it. */
export const Facts = ({
  accessibility,
  label,
  measurements,
}: {
  accessibility: [string, ReactNode][];
  label: string;
  measurements: [string, string, string][];
}) => (
  <div className={styles.facts}>
    <div className={styles.factsColumn}>
      <h3 className={styles.h3}>Measurements</h3>
      <div
        aria-label={`${label} measurements`}
        className={styles.table}
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
  </div>
);
