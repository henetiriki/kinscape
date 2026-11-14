import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Icon } from '@ks/app/components/foundation/Icon';
import { Text } from '@ks/app/components/foundation/Text';
import { FuzzyDateField } from '@ks/features/people';
import {
  fuzzyDateMessage,
  readFuzzyDate,
} from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { parseFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';
import { requireDevPage } from '@ks/server/auth/current.mts';

import styles from '@ks/app/screens/fuzzy-date-readings/readings.module.css';

export const metadata: Metadata = { title: 'Fuzzy dates' };

const HELPER = 'For example 1850, ABT 1850 or BET 1850 AND 1855.';

const QUALIFIERS = [
  ['Exact date', '14 MAR 1850'],
  ['About', 'ABT 1850'],
  ['Before', 'BEF 1850'],
  ['After', 'AFT 1850'],
  ['Between', 'BET 1850 AND 1855'],
  ['Period', 'FROM 1850 TO 1855'],
  ['Estimated', 'EST 1850'],
  ['Calculated', 'CAL 1850'],
] as const;

const ERRORS = [
  ['Wrong format', '14/03/1850'],
  ['Year out of range', 'ABT 850'],
  ["Day doesn't exist", '31 FEB 1850'],
  ['Range in reverse', 'BET 1855 AND 1850'],
] as const;

const RULES = [
  "The reading takes the helper's place and follows the typing. It's a polite live region, so it's read after a pause.",
  'Check on Enter or when focus leaves, never while the user types.',
  'A bad date keeps its text. The field gets a 2px error border, an error icon and aria-invalid. The message replaces the reading and is linked with aria-describedby.',
  'The message stays until the next check.',
  'Save checks every field. Nothing saves while one has an error, and an alert above the form counts them.',
  'A good date gets no success styling. The reading is the confirmation.',
];

/** What the readings and messages say for `text`, from the same functions that the field calls. */
const reading = (text: string) =>
  readFuzzyDate(
    (
      parseFuzzyDate(text) as Extract<
        ReturnType<typeof parseFuzzyDate>,
        { ok: true }
      >
    ).value
  );

const problem = (text: string) =>
  fuzzyDateMessage(
    (
      parseFuzzyDate(text) as Extract<
        ReturnType<typeof parseFuzzyDate>,
        { ok: false }
      >
    ).error,
    text
  );

const Row = ({
  children,
  label,
  text,
}: {
  children: ReactNode;
  label: string;
  text: string;
}) => (
  <tr className={styles.row}>
    <th className={styles.case} scope='row'>
      <Text variant='label'>{label}</Text>
    </th>
    <td className={styles.typed}>{text}</td>
    <td>{children}</td>
  </tr>
);

/** The `fuzzy-date-readings` board: every reading and message of the field, then its states. */
const Page = async () => {
  await requireDevPage();

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <span className={styles.kicker}>
          <Text variant='overline'>People · Birth and death</Text>
        </span>
        <Text as='h1' variant='h1'>
          Fuzzy dates
        </Text>
        <Text variant='body'>
          Birth and death each take one line of GEDCOM-style text. Under the
          field, a plain reading follows the typing. A problem shows only after
          Enter or when focus leaves, as for the map date field.
        </Text>
      </div>
      <div className={styles.columns}>
        <div className={styles.cases}>
          <table className={styles.table}>
            <caption className={styles.caption}>
              What the user types and what shows under the field
            </caption>
            <thead>
              <tr className={styles.head}>
                <th className={styles.caseHead} scope='col'>
                  <Text variant='overline'>Case</Text>
                </th>
                <th className={styles.typedHead} scope='col'>
                  <Text variant='overline'>The user types</Text>
                </th>
                <th scope='col'>
                  <Text variant='overline'>Under the field</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={styles.group} colSpan={3} scope='rowgroup'>
                  <Text variant='title'>Qualifiers: one reading each</Text>
                </th>
              </tr>
              {QUALIFIERS.map(([label, text]) => (
                <Row key={label} label={label} text={text}>
                  <Text as='p' variant='small'>
                    Reads as{' '}
                    <strong className={styles.reading}>{reading(text)}</strong>
                  </Text>
                </Row>
              ))}
              <tr>
                <th className={styles.groupLate} colSpan={3} scope='rowgroup'>
                  <Text variant='title'>
                    Errors: one message each, shown after Enter or leaving the
                    field
                  </Text>
                </th>
              </tr>
              {ERRORS.map(([label, text]) => (
                <Row key={label} label={label} text={text}>
                  <span className={styles.error}>
                    <Icon name='error' />
                    <Text tone='error' variant='small'>
                      {problem(text)}
                    </Text>
                  </span>
                </Row>
              ))}
            </tbody>
          </table>
          <Text variant='caption'>
            An exact year or month reads &quot;In 1850&quot; or &quot;In March
            1850&quot;. Lower case works too. Months are JAN to DEC. Years run
            from 1000 to 2999.
          </Text>
        </div>
        <div className={styles.side}>
          <section aria-labelledby='fd-rules' className={styles.rules}>
            <Text as='h2' id='fd-rules' variant='h3'>
              How it behaves
            </Text>
            <ol className={styles.list}>
              {RULES.map(rule => (
                <li key={rule}>
                  <Text variant='body'>{rule}</Text>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby='fd-try' className={styles.try}>
            <Text as='h2' id='fd-try' variant='h3'>
              Try it
            </Text>
            <FuzzyDateField defaultValue='ABT 1850' label='Birth' />
          </section>
        </div>
      </div>
      <section aria-labelledby='fd-states' className={styles.states}>
        <Text as='h2' id='fd-states' variant='h3'>
          The field&apos;s states
        </Text>
        <div className={styles.grid}>
          <div className={styles.state}>
            <Text variant='caption'>Empty: the helper shows an example</Text>
            <FuzzyDateField helper={HELPER} label='Birth' />
          </div>
          <div className={styles.state}>
            <Text variant='caption'>
              Typing, with focus: the reading follows
            </Text>
            <FuzzyDateField
              defaultValue='BET 1850 AND 18'
              helper={HELPER}
              label='Birth'
              state='focus'
            />
            <Text variant='caption'>
              Not readable yet, so the example stays. No error while typing.
            </Text>
          </div>
          <div className={styles.state}>
            <Text variant='caption'>
              Readable: the reading replaces the example
            </Text>
            <FuzzyDateField
              defaultValue='BET 1850 AND 1855'
              helper={HELPER}
              label='Birth'
            />
          </div>
          <div className={styles.state}>
            <Text variant='caption'>After Enter or leaving: the error</Text>
            <FuzzyDateField
              defaultValue='31 FEB 1850'
              helper={HELPER}
              label='Death'
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
