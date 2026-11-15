import type { PersonDates } from '@ks/app/components/actions/types';

import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { TextAreaField } from '@ks/app/components/forms/TextAreaField';
import {
  ByViewport,
  code,
  DesktopOnly,
  Facts,
  PhoneOnly,
  Section,
  Variant,
  Variants,
} from '@ks/app/design-kit/inputs/Board';
import { FuzzyDateField } from '@ks/features/people';
import { FUZZY_DATE_HELPER, LONG_NOTES } from '@ks/lib/design/samples.mts';

import styles from '@ks/app/design-kit/inputs/page.module.css';

// The samples link to a page that exists; a click on one is not part of the board.
const HREF = '/';

const NO_DATE: PersonDates = {
  born: '',
  bornReading: '',
  died: '',
  diedReading: '',
};
const BORN = { born: '1889', bornReading: 'In 1889' };
const DIED = { died: '1932', diedReading: 'In 1932' };

export const DATES = { none: NO_DATE, range: { ...NO_DATE, ...BORN, ...DIED } };

const line = (caption: string, props: Partial<PersonDates>) => ({
  caption,
  props: { ...NO_DATE, ...props },
});

/** The six lines of the Spec, each with its reading. */
const LINES = [
  line(
    'Born only · "1889 –", with nothing after the dash for a living Person.',
    BORN
  ),
  line('No dates · "? –".', {}),
  line('Marked deceased, no death date · "1889 – ?".', {
    ...BORN,
    deceased: true,
  }),
  line('Marked deceased, no dates · "? – ?".', { deceased: true }),
  line('Death only · "? – 1932".', DIED),
  line('Both dates · "1889 – 1932".', { ...BORN, ...DIED }),
];

const HELPER = 'Up to 10,000 characters.';

export const LongTextFields = () => (
  <Section
    desktopPart={2}
    lead='For a note of several lines, such as the notes on a Person. It has the look of a text field, resizes up and down only, and scrolls long content inside the box.'
    part={2}
    title='Long text field'>
    <Variants>
      <Variant caption='Default · label 14 / 20 · 600, 8 above; 1px field-border, radius 8, padding 10 12; text 15 / 22 (16 / 24 on a phone). Helper under it.'>
        <div className={styles.areaField}>
          <TextAreaField helper={HELPER} label='Notes' maxLength={10000} />
        </div>
      </Variant>
      <Variant caption='Hover · the border turns ink-3.'>
        <div className={styles.areaField}>
          <TextAreaField
            helper={HELPER}
            label='Notes, hover'
            maxLength={10000}
            state='hover'
          />
        </div>
      </Variant>
      <Variant caption='Focus · a 2px brand border. The padding is 1 less, so the text stays still.'>
        <div className={styles.areaField}>
          <TextAreaField
            helper={HELPER}
            label='Notes, focus'
            maxLength={10000}
            state='focus'
          />
        </div>
      </Variant>
      <Variant caption='Disabled · surface-2 fill, line border, ink-disabled text.'>
        <div className={styles.areaField}>
          <TextAreaField
            disabled
            helper={HELPER}
            label='Notes, disabled'
            maxLength={10000}
          />
        </div>
      </Variant>
      <Variant caption='Long content · the text scrolls inside the box. The handle moves the bottom edge up and down.'>
        <div className={styles.areaField}>
          <TextAreaField
            defaultValue={LONG_NOTES}
            helper={HELPER}
            label='Notes, long content'
            maxLength={10000}
          />
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Label',
          <>
            A visible {code('<label for>')}on a real {code('textarea.')}
          </>,
        ],
        [
          'Helper',
          <>
            The text under the field. {code('aria-describedby')}points at it.
          </>,
        ],
        [
          'Limit',
          <>
            {code('maxLength')}stops the text at that many characters. The
            Person form uses 10,000.
          </>,
        ],
        [
          'Keyboard',
          'Tab to reach. Enter adds a line. Focus shows the 2px brand border.',
        ],
      ]}
      label='Long text field'
      measurements={[
        [
          'Border',
          '1px field-border; hover 1px ink-3; focus 2px brand, padding 1 less',
          'colour.field-border · colour.ink-3 · colour.brand',
        ],
        ['Radius', '8', 'radius.control'],
        ['Padding', '10 12', 'space.12 · 10: no token'],
        [
          'Text',
          <ByViewport
            desktop='15 / 22'
            key='value'
            phone='16 / 24, so the browser does not zoom in'
          />,
          'type.body · type.body-l',
        ],
        ['Label', '14 / 20 · 600, 8 above the field', 'type.label · space.8'],
        ['Resize', 'Vertical only', '—'],
      ]}
    />
  </Section>
);

export const FuzzyDateFields = () => (
  <Section
    desktopPart={2}
    lead='For a date typed as GEDCOM text, such as a Person’s birth. A reading follows the typing. An error shows when the user leaves the field or presses Enter.'
    part={4}
    title='Fuzzy date field'>
    <Variants>
      <Variant caption='Empty · the helper under the field.'>
        <div className={styles.dateField}>
          <FuzzyDateField helper={FUZZY_DATE_HELPER} label='Born' />
        </div>
      </Variant>
      <Variant caption='Typing, not readable · the text and the same helper. No error while the user types.'>
        <div className={styles.dateField} inert>
          <FuzzyDateField
            defaultValue='BET 1850 AND 18'
            helper={FUZZY_DATE_HELPER}
            label='Born, typing'
            state='focus'
          />
        </div>
      </Variant>
      <Variant caption='Readable · “Reads as” and the reading in bold. A good date gets no success styling.'>
        <div className={styles.dateField}>
          <FuzzyDateField
            defaultValue='BET 1850 AND 1855'
            helper={FUZZY_DATE_HELPER}
            label='Born, readable'
          />
        </div>
      </Variant>
      <Variant caption='Focus · a 2px brand border.'>
        <div className={styles.dateField} inert>
          <FuzzyDateField
            helper={FUZZY_DATE_HELPER}
            label='Born, focus'
            state='focus'
          />
        </div>
      </Variant>
      <Variant caption='Error · the text stays. A 2px error-border, the error icon inside and the message under it.'>
        <div className={styles.dateField} inert>
          <FuzzyDateField
            defaultValue='31 FEB 1850'
            helper={FUZZY_DATE_HELPER}
            label='Born, error'
          />
        </div>
      </Variant>
      <Variant caption='Disabled · surface-2 fill, line border, ink-disabled text.'>
        <div className={styles.dateField}>
          <FuzzyDateField
            disabled
            helper={FUZZY_DATE_HELPER}
            label='Born, disabled'
          />
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Label',
          <>
            A visible {code('<label for>')}on a real {code('input.')}
          </>,
        ],
        [
          'Message',
          <>
            One {code('aria-live="polite"')}slot holds the helper, the reading
            or the error. The error is {code('role="alert"')}and the input has{' '}
            {code('aria-invalid')}and {code('aria-describedby')}for the slot.
          </>,
        ],
        [
          'Keyboard',
          'Tab to reach. Enter checks the text. Focus shows the 2px brand border.',
        ],
      ]}
      label='Fuzzy date field'
      measurements={[
        [
          'Border',
          '1px field-border; focus 2px brand; error 2px error-border',
          'colour.field-border · colour.brand · colour.error-border',
        ],
        ['Radius', '8', 'radius.control'],
        ['Height', '44', 'size.field'],
        [
          'Text',
          <ByViewport
            desktop='JetBrains Mono 15 / 22 · 400, ligatures off'
            key='value'
            phone='16 / 24, so the browser does not zoom in'
          />,
          'type.mono-m · type.body-l',
        ],
        ['Label', '14 / 20 · 600, 8 above the field', 'type.label · space.8'],
        ['Message', '13 / 20, 8 under the field', 'type.small · space.8'],
      ]}
    />
  </Section>
);

export const PersonRows = () => (
  <Section
    desktopPart={2}
    lead='A row of the people list. The whole row is one link to edit the Person: name, Dates, then Edit. An optional Relationships link follows it.'
    part={4}
    phoneLead='A row of the people list on a phone. It is not a link: the name, then one line of dates.'
    title='Person row'>
    <PhoneOnly>
      <Variants>
        {LINES.map(({ caption, props }) => (
          <Variant caption={caption} key={caption} phone>
            <div className={styles.phoneRow} inert>
              <PersonRow
                {...props}
                form='phone'
                givenNames='Hendrik Willem'
                href={HREF}
                surname='Botha'
              />
            </div>
          </Variant>
        ))}
        <Variant
          caption='Maiden name · a Small note after the dates, "née {maiden}".'
          phone>
          <div className={styles.phoneRow} inert>
            <PersonRow
              {...DATES.range}
              form='phone'
              givenNames='Susanna'
              href={HREF}
              maidenName='Fourie'
              surname='Botha'
            />
          </div>
        </Variant>
      </Variants>
    </PhoneOnly>
    <PhoneOnly>
      <Facts
        accessibility={[
          [
            'Role',
            <>
              One {code('div')}with no link and no Edit. The name and the dates
              are its text.
            </>,
          ],
          [
            'Dates',
            'One line, such as "1889 –", "? – ?" or "bef. 1840 – ?". A hidden text reads the dates in words.',
          ],
          ['Keyboard', 'No stop: the row is not a link.'],
        ]}
        label='Person row on a phone'
        measurements={[
          ['Height', 'At least 60', '—'],
          ['Padding', '8 0', 'space.8'],
          ['Name', 'Title', 'type.title'],
          [
            'Dates',
            'Mono, with the note in Small after it, 12 apart',
            'type.mono · type.small · space.12',
          ],
          ['Top line', '1px line', 'colour.line'],
        ]}
      />
    </PhoneOnly>
    <DesktopOnly>
      <Variants>
        {LINES.map(({ caption, props }) => (
          <Variant caption={caption} key={caption}>
            <div className={styles.personRow} inert>
              <PersonRow
                {...props}
                givenNames='Hendrik Willem'
                href={HREF}
                surname='Botha'
              />
            </div>
          </Variant>
        ))}
        <Variant caption='Maiden name · a Small line, "née {maiden}".'>
          <div className={styles.personRow} inert>
            <PersonRow
              {...DATES.range}
              givenNames='Susanna'
              href={HREF}
              maidenName='Fourie'
              surname='Botha'
            />
          </div>
        </Variant>
        <Variant caption='Maiden name and a matched variant · both notes, in that order, on one line.'>
          <div className={styles.personRow} inert>
            <PersonRow
              {...DATES.range}
              givenNames='Maria Magdalena'
              href={HREF}
              maidenName='Rossouw'
              matchedVariant='Dutoit'
              surname='du Toit'
            />
          </div>
        </Variant>
        <Variant caption='The Relationships link · a text link after the row link.'>
          <div className={styles.personRow} inert>
            <PersonRow
              {...DATES.range}
              givenNames='Anna Catharina'
              href={HREF}
              relationshipsHref={HREF}
              surname='le Roux'
            />
          </div>
        </Variant>
      </Variants>
      <Variants>
        {(
          [
            ['Default', undefined],
            ['Hover · surface-2 fill', 'hover'],
            ['Focus (keyboard) · the focus ring', 'focus'],
            ['Pressed · segment fill, brand-pressed Edit', 'active'],
          ] as const
        ).map(([caption, state]) => (
          <Variant caption={caption} key={caption}>
            <div className={styles.personRow} inert>
              <PersonRow
                {...DATES.range}
                givenNames='Anna Catharina'
                href={HREF}
                state={state}
                surname='le Roux'
              />
            </div>
          </Variant>
        ))}
      </Variants>
    </DesktopOnly>
    <DesktopOnly>
      <Facts
        accessibility={[
          [
            'Role',
            <>
              One {code('a')}with an {code('href')}to the edit page. The name,
              the dates and Edit are its name.
            </>,
          ],
          [
            'Dates',
            <>
              The line is hidden from a screen reader. A hidden text reads the
              dates in words, such as &quot;Born in 1889, died unknown&quot;.
              The Relationships link reads &quot;Relationships, Surname, Given
              names&quot;.
            </>,
          ],
          [
            'Keyboard',
            <>
              Tab to reach, Enter to follow. Focus shows the ring only on{' '}
              {code(':focus-visible.')}
            </>,
          ],
        ]}
        label='Person row'
        measurements={[
          ['Height', 'At least 52', 'size.row-l'],
          [
            'Grid',
            'Name, 200 Dates, 72 Edit; gap 16; padding 8 20',
            'space.16 · space.8 · space.20',
          ],
          ['Name', 'Title, with the note in Small', 'type.title · type.small'],
          ['Dates', 'Mono', 'type.mono'],
          [
            'Edit',
            'Brand, with the forward icon 16, 4 apart',
            'colour.brand · space.4',
          ],
          ['Hover', 'surface-2 fill', 'colour.surface-2'],
          [
            'Pressed',
            'segment fill; Edit in brand-pressed',
            'colour.segment · colour.brand-pressed',
          ],
          [
            'Focus',
            '2px outline, 2px outside',
            'focus.width · focus.offset · colour.focus-ring',
          ],
        ]}
      />
    </DesktopOnly>
  </Section>
);
