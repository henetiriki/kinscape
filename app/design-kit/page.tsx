import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { notFound } from 'next/navigation';

import type { ControlState } from '@/app/components/controls';

import { Button } from '@/app/components/Button';
import { Checkbox } from '@/app/components/Checkbox';
import { Chip } from '@/app/components/Chip';
import { IconButton } from '@/app/components/IconButton';
import { Segmented } from '@/app/components/Segmented';
import { Tabs } from '@/app/components/Tabs';
import { TextLink } from '@/app/components/TextLink';

import kit from './kit.module.css';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'KinScape design kit' };

// A column of the board: the state a control shows, or Disabled.
type Column = 'default' | 'disabled' | ControlState;

const COLUMNS: { column: Column; title: string }[] = [
  { column: 'default', title: 'Default' },
  { column: 'hover', title: 'Hover' },
  { column: 'focus', title: 'Focus (keyboard)' },
  { column: 'active', title: 'Pressed' },
  { column: 'disabled', title: 'Disabled' },
];

const stateOf = (column: Column): ControlState | undefined =>
  column === 'default' || column === 'disabled' ? undefined : column;

const Plus = () => (
  <svg
    aria-hidden='true'
    fill='none'
    height='18'
    stroke='currentColor'
    strokeLinecap='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='18'>
    <path d='M12 5v14M5 12h14' />
  </svg>
);

const ROWS: {
  hint: string;
  name: string;
  render?: (column: Column) => ReactNode;
}[] = [
  {
    hint: 'One per view',
    name: 'Primary button',
    render: column => (
      <Button
        disabled={column === 'disabled'}
        state={stateOf(column)}
        variant='primary'>
        Sign in
      </Button>
    ),
  },
  {
    hint: 'Everything else',
    name: 'Secondary button',
    render: column => (
      <Button disabled={column === 'disabled'} state={stateOf(column)}>
        Copy chain
      </Button>
    ),
  },
  {
    hint: 'Zoom, close, step',
    name: 'Icon button',
    render: column => (
      <IconButton
        disabled={column === 'disabled'}
        label='Zoom in'
        state={stateOf(column)}>
        <Plus />
      </IconButton>
    ),
  },
  {
    hint: 'In text and popups',
    name: 'Link',
    render: column => (
      <TextLink
        disabled={column === 'disabled'}
        href='#attributions'
        state={stateOf(column)}>
        Attributions
      </TextLink>
    ),
  },
  // The Text field is built in DM.5: the row keeps its place so the rows below don't shift.
  { hint: 'Pressed column shows it filled', name: 'Text field' },
  {
    hint: 'Off and on; 44px hit area',
    name: 'Checkbox',
    render: column => (
      <>
        <Checkbox
          aria-label='Checkbox off'
          disabled={column === 'disabled'}
          state={stateOf(column)}
        />
        <Checkbox
          aria-label='Checkbox on'
          defaultChecked
          disabled={column === 'disabled'}
          state={stateOf(column)}
        />
      </>
    ),
  },
  {
    hint: 'Off and on',
    name: 'Chip',
    render: column => (
      <>
        <Chip
          disabled={column === 'disabled'}
          on={false}
          state={stateOf(column)}>
          Birth
        </Chip>
        <Chip
          disabled={column === 'disabled'}
          on
          state={column === 'focus' ? undefined : stateOf(column)}>
          Marriage
        </Chip>
      </>
    ),
  },
  {
    hint: 'State shown on "Month"',
    name: 'Segmented',
    render: column => (
      <Segmented
        disabled={column === 'disabled'}
        label={`Precision, ${column}`}
        name={`precision-${column}`}
        options={[
          { label: 'Year', value: 'year' },
          { label: 'Month', state: stateOf(column), value: 'month' },
        ]}
        value='year'
      />
    ),
  },
  {
    hint: 'State shown on "Filters"',
    name: 'Tab',
    render: column => (
      <Tabs
        disabled={column === 'disabled'}
        label={`Panels, ${column}`}
        selected='layers'
        tabs={[
          { label: 'Layers', value: 'layers' },
          { label: 'Filters', state: stateOf(column), value: 'filters' },
        ]}
      />
    ),
  },
];

const DesignKit = () => {
  // Vercel sets VERCEL_ENV at build, so in production the page is built as a 404.
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  return (
    <main className={styles.kit}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>Style guide · 04</span>
        <h1 className={kit.kitTitle}>Component states</h1>
        <p className={kit.kitLead}>
          How every control looks at rest, under the pointer, with keyboard
          focus, while pressed and when it can&apos;t be used. Toggles show off
          and on side by side.
        </p>
      </header>

      <figure aria-label='State matrix' className={styles.kitMatrix}>
        <div className={`${styles.kitRow} ${styles.kitColumns}`}>
          <span>Component</span>
          {COLUMNS.map(({ title }) => (
            <span key={title}>{title}</span>
          ))}
        </div>
        {ROWS.map(({ hint, name, render }) => (
          <div className={styles.kitRow} key={name}>
            <span className={styles.kitName}>
              <span>{name}</span>
              <span className={styles.kitHint}>{hint}</span>
            </span>
            {COLUMNS.map(({ column }) => (
              // Hover, Focus and Pressed are looks, not controls: inert keeps them out of the tab order and the accessibility tree.
              <span
                className={styles.kitCell}
                inert={stateOf(column) !== undefined}
                key={column}>
                {render?.(column)}
              </span>
            ))}
          </div>
        ))}
      </figure>

      <div className={kit.kitNotes}>
        <section>
          <h2>Rules</h2>
          <ul>
            <li>
              Focus is a 2px brand outline, 2px outside the control, shown on
              keyboard focus only (<code>:focus-visible</code>). Fields show
              focus with a 2px brand border instead. In dark banners the ring is
              white.
            </li>
            <li>
              Hover only darkens or tints. Nothing important lives only on
              hover: touch screens don&apos;t have it.
            </li>
            <li>
              Pressed is the <code>:active</code> moment. Toggles keep their
              &quot;on&quot; look afterwards, through <code>aria-pressed</code>{' '}
              or <code>checked</code>.
            </li>
            <li>
              Disabled controls keep their shape and drop to ink-disabled on
              line or surface-2. Say why nearby, or leave the control out.
            </li>
          </ul>
        </section>
        <section>
          <h2>Sizes</h2>
          <ul>
            <li>
              Touch targets at least 44 × 44px. A smaller visual (a 20px
              checkbox, a 36px chip) sits inside a 44px hit area.
            </li>
            <li>
              Buttons: 50px on sign-in, 44px in panels and the dock, 40px inside
              cards.
            </li>
            <li>
              Fields: 44px in the app, 48px on sign-in. Field text 15px, 16px on
              phones.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
};

export default DesignKit;
