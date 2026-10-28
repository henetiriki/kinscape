import type { Metadata } from 'next';

import { Alert } from '@ks/app/components/feedback/Alert';
import { Banner } from '@ks/app/components/feedback/Banner';
import { Toast } from '@ks/app/components/feedback/Toast';
import { TextField } from '@ks/app/components/forms/TextField';
import { Text } from '@ks/app/components/foundation/Text';
import { boardTitle } from '@ks/app/design-kit/boards';
import { DateCase } from '@ks/app/design-kit/feedback/DateCase';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';

import kit from '@ks/app/design-kit/kit.module.css';

import styles from '@ks/app/design-kit/feedback/page.module.css';

export const metadata: Metadata = { title: boardTitle('feedback') };

// The map's sea is a map token, which has no CSS variable.
const { map } = resolveTokens(rawTokens);

const YEAR_1901 = { day: toDay('1901-01-01'), precision: 'year' } as const;

const CASES = [
  {
    initial: YEAR_1901,
    note: 'The resting state. A good date never turns green.',
    title: 'Default',
  },
  {
    defaultText: '1901-0',
    initial: YEAR_1901,
    note: 'Focused, half typed. Nothing is checked yet.',
    state: 'focus',
    title: 'Typing',
  },
  {
    defaultText: '14/06/1901',
    initial: YEAR_1901,
    note: 'Shows the formats it does accept.',
    title: 'Wrong format',
  },
  {
    defaultText: '1650',
    initial: YEAR_1901,
    note: 'Offers the nearest date that works.',
    title: 'Before 1652',
  },
  {
    defaultText: '2031',
    initial: YEAR_1901,
    note: 'Same pattern as before 1652.',
    title: 'After today',
  },
  {
    defaultText: '1901-02-30',
    initial: YEAR_1901,
    note: 'Says exactly what was off.',
    title: "Doesn't exist",
  },
  {
    initial: { day: toDay('1750-01-01'), precision: 'year' },
    note: 'A valid date: the map moves, but you should know.',
    notice: { text: 'No borders are mapped for 1750 yet.', tone: 'warning' },
    title: 'Warning',
  },
  {
    initial: { day: toDay('1901-06-01'), precision: 'month' },
    note: 'Explains something the app did for you.',
    notice: { text: 'Switched to month precision.', tone: 'info' },
    title: 'Info',
  },
] as const;

// The phone boards say "date sheet" and "under the search bar" where the desktop ones say "dock" and "top centre".
const Wording = ({ desktop, phone }: { desktop: string; phone: string }) => (
  <>
    <span className={styles.desktopOnly}>{desktop}</span>
    <span className={styles.phoneOnly}>{phone}</span>
  </>
);

const BEHAVIOUR = [
  <>
    Keep what was typed. Mark the field with a 2px error border and an icon, set{' '}
    <code>aria-invalid</code> , and link the message with{' '}
    <code>aria-describedby</code> .
  </>,
  <>
    One line that says what&apos;s wrong and how to fix it, with the fix in the
    user&apos;s own format. No codes, no &quot;invalid input&quot;.
  </>,
  'The map, slider and URL stay on the last good date, and the message says which date that is.',
  'Esc puts back the last good date. The slider, the step buttons and the Jump to buttons also clear the error.',
  'Out of range offers the nearest good date as a one-click fix.',
  'A good date gets no success styling. The map moving is the confirmation.',
  'Typing more detail than the current precision (1901-06 while on Year) switches precision and says so for 4 seconds.',
  <>
    In the <Wording desktop='dock' phone='date sheet' /> the message opens above
    the field, pointing at it, so it isn’t cut off at the bottom of the screen.
  </>,
];

const ALERTS = [
  {
    role: 'alert',
    text: "The map couldn't load borders for this date.",
    title: 'Error',
    tone: 'error',
  },
  {
    role: 'status',
    text: 'Borders before 1910 are approximate in this area.',
    title: 'Warning',
    tone: 'warning',
  },
  {
    role: 'status',
    text: 'Export saved: kinscape-2026-10-21.zip',
    title: 'Success',
    tone: 'success',
  },
  {
    role: 'status',
    text: 'Names on the map are the names used on the map date.',
    title: 'Info',
    tone: 'info',
  },
] as const;
const FeedbackKit = () => (
  <main className={styles.kit}>
    <header className={kit.kitHeader}>
      <span className={kit.kitEyebrow}>Style guide · 05</span>
      <h1 className={kit.kitTitle}>Feedback and validation</h1>
      <p className={kit.kitLead}>
        Errors block until fixed, warnings don&apos;t, success confirms
        something finished, info explains something the app did. Every one comes
        with an icon and words, never colour alone.
      </p>
    </header>

    <section aria-labelledby='date-field' className={styles.section}>
      <div className={styles.intro}>
        <h2 className={styles.h2} id='date-field'>
          The map date field
        </h2>
        <p className={styles.lede}>
          Accepts 1901, 1901-06 or 1901-06-14 (single digits like 1901-6-4 are
          fine and get padded). It checks on Enter or when focus leaves, never
          while you type. Shown here with its message below; in the{' '}
          <Wording desktop='dock' phone='date sheet' /> the message sits above
          the field.
        </p>
      </div>
      <div className={styles.cases}>
        {CASES.map(({ note, title, ...date }) => (
          <div className={styles.card} key={title}>
            <Text variant='overline'>{title}</Text>
            <DateCase {...date} />
            <Text variant='caption'>{note}</Text>
          </div>
        ))}
      </div>
    </section>

    <section className={styles.split}>
      <div className={`${styles.column} ${styles.dockColumn}`}>
        <h3 className={styles.h3}>
          In the <Wording desktop='dock' phone='date sheet' />
        </h3>
        <div
          className={`${styles.sea} ${styles.desktopOnly}`}
          style={{ background: map.sea }}>
          <DateCase
            defaultText='1901-02-30'
            dock
            initial={{ day: toDay('1901-02-28'), precision: 'day' }}
            placement='above'
          />
        </div>
        <div
          className={`${styles.seaSheet} ${styles.phoneOnly}`}
          style={{ background: map.sea }}>
          <DateCase
            defaultText='1901-02-30'
            initial={{ day: toDay('1901-02-28'), precision: 'day' }}
            placement='above'
            sheet
          />
        </div>
      </div>
      <div className={`${styles.column} ${styles.behaviourColumn}`}>
        <h3 className={styles.h3}>Behaviour</h3>
        <ol className={styles.behaviour}>
          {BEHAVIOUR.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>
    </section>

    <section className={`${styles.split} ${styles.forms}`}>
      <div className={styles.column}>
        <h2 className={styles.h2}>Form fields</h2>
        <div className={styles.pair}>
          <TextField
            defaultValue='researcher@example.com'
            helper='Helper text sits here in ink-3.'
            label='Email'
            size='l'
          />
          <TextField
            defaultValue='researcher@example'
            error='Add the rest of the address, like name@example.com.'
            label='Email'
            size='l'
          />
        </div>
        <p className={`${styles.lede} ${styles.where}`}>
          Field errors go under the field and replace its helper text. When a
          submit fails for a reason that isn&apos;t one field (wrong password),
          use an error alert above the fields instead, as on the sign-in screen.
        </p>
      </div>
      <div className={styles.column}>
        <h2 className={styles.h2}>Alerts</h2>
        <div className={styles.alerts}>
          {ALERTS.map(({ role, text, title, tone }) => (
            <div className={styles.alertRow} key={tone}>
              <Alert
                aside={<code className={styles.role}>role={role}</code>}
                title={title}
                tone={tone}>
                {text}
              </Alert>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <h2 className={styles.h2}>Toasts and banners</h2>
      <div className={styles.toasts}>
        <div className={styles.example}>
          <Toast tone='success'>Jurisdiction chain copied.</Toast>
          <span className={styles.note}>
            Success toast. Bottom centre, above the{' '}
            <Wording desktop='dock' phone='date sheet' />. Gone after 4 seconds;
            nothing to click.
          </span>
        </div>
        <div className={styles.example}>
          <Toast action='Try again' tone='error'>
            The export didn&apos;t finish.
          </Toast>
          <span className={styles.note}>
            Error toast. Stays until dismissed or retried.
          </span>
        </div>
        <div className={styles.example}>
          <Banner action='Retry' icon='cloudOff'>
            Terrain didn&apos;t load.
          </Banner>
          <span className={styles.note}>
            Banner.{' '}
            <Wording desktop='Top centre' phone='Under the search bar' />, for
            app-wide problems that don&apos;t stop the map.
          </span>
        </div>
      </div>
      <p className={`${styles.lede} ${styles.where}`}>
        Where it goes: a field&apos;s problem goes next to the field; a problem
        with one part of the screen goes in an alert in that part; the result of
        something you just did goes in a toast; something wrong with the app
        goes in a banner. Errors and failures use{' '}
        <code>role=&quot;alert&quot;</code> ; everything else uses{' '}
        <code>role=&quot;status&quot;</code> .
      </p>
    </section>
  </main>
);

export default FeedbackKit;
