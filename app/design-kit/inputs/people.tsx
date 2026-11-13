import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { TextAreaField } from '@ks/app/components/forms/TextAreaField';
import {
  ByViewport,
  code,
  DesktopOnly,
  Facts,
  Section,
  Variant,
  Variants,
} from '@ks/app/design-kit/inputs/Board';
import { LONG_NOTES } from '@ks/lib/design/samples.mts';

import styles from '@ks/app/design-kit/inputs/page.module.css';

// The samples link to a page that exists; a click on one is not part of the board.
const HREF = '/';

const HELPER = 'Up to 10,000 characters.';

export const LongTextFields = () => (
  <Section
    lead='For a note of several lines, such as the notes on a Person. It has the look of a text field, resizes up and down only, and scrolls long content inside the box.'
    part={1}
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

export const PersonRows = () => (
  <Section
    lead='A row of the people list. The whole row is one link to edit the Person: name, Born, Died, then Edit.'
    part={1}
    phoneLead='Desktop only: the phone form of the row comes with the phone people list. See the desktop board.'
    title='Person row'>
    <DesktopOnly>
      <Variants>
        <Variant caption='A plain row · name in Title; Born and Died in Mono.'>
          <div className={styles.personRow} inert>
            <PersonRow
              born='1832'
              died='1899'
              givenNames='Hendrik Willem'
              href={HREF}
              surname='Botha'
            />
          </div>
        </Variant>
        <Variant caption='Maiden name · a Small line, "née {maiden}".'>
          <div className={styles.personRow} inert>
            <PersonRow
              born='c. 1835'
              died='1901'
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
              born='c. 1856'
              died='1930'
              givenNames='Maria Magdalena'
              href={HREF}
              maidenName='Rossouw'
              matchedVariant='Dutoit'
              surname='du Toit'
            />
          </div>
        </Variant>
        <Variant caption='No death date · Died shows "—".'>
          <div className={styles.personRow} inert>
            <PersonRow
              born='1878'
              givenNames='Johanna Petronella'
              href={HREF}
              surname='Rossouw'
            />
          </div>
        </Variant>
        <Variant caption='Marked deceased with no date · Died shows "Deceased".'>
          <div className={styles.personRow} inert>
            <PersonRow
              born='bef. 1840'
              deceased
              givenNames='Pieter'
              href={HREF}
              surname='Fourie'
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
                born='1871'
                died='1948'
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
              A hidden &quot;Born&quot; and &quot;Died&quot; name each date.
              Died reads &quot;—&quot; with no date.
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
            'Name, 160 Born, 160 Died, 72 Edit; gap 16; padding 8 20',
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
