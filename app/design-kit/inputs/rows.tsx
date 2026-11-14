import { PickerRow } from '@ks/app/components/actions/PickerRow';
import { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import {
  code,
  DesktopOnly,
  Facts,
  Section,
  Variant,
  Variants,
} from '@ks/app/design-kit/inputs/Board';
import { DATES } from '@ks/app/design-kit/inputs/people';

import styles from '@ks/app/design-kit/inputs/page.module.css';

const HREF = '/';

const SPOUSE = {
  ...DATES.none,
  born: 'c. 1835',
  bornReading: 'About 1835',
  givenNames: 'Susanna',
  surname: 'Botha',
};

// No `part`: a phone has no form of these rows, so no part of a phone shows them.
export const RelationshipRows = () => (
  <Section
    desktopPart={2}
    lead='One relationship of a Person: the other Person, the line of dates, and Edit. It has no remove control.'
    title='Relationship row'>
    <DesktopOnly>
      <Variants>
        {(['biological', 'adoptive', 'step'] as const).map(subtype => (
          <Variant
            caption={`A parent or child · the ${subtype} subtype in Small.`}
            key={subtype}>
            <div className={styles.personRow} inert>
              <RelationshipRow
                {...DATES.range}
                givenNames='Anna Catharina'
                href={HREF}
                subtype={subtype}
                surname='le Roux'
              />
            </div>
          </Variant>
        ))}
        <Variant caption='A spouse with both dates · "m. 1875 – div. 1890".'>
          <div className={styles.personRow} inert>
            <RelationshipRow
              {...SPOUSE}
              divorced='1890'
              divorcedReading='In 1890'
              href={HREF}
              married='1875'
              marriedReading='In 1875'
            />
          </div>
        </Variant>
        <Variant caption='A spouse with one date · "m. c. 1875".'>
          <div className={styles.personRow} inert>
            <RelationshipRow
              {...SPOUSE}
              href={HREF}
              married='c. 1875'
              marriedReading='About 1875'
            />
          </div>
        </Variant>
        <Variant caption='A spouse with no date · no date text.'>
          <div className={styles.personRow} inert>
            <RelationshipRow {...SPOUSE} href={HREF} />
          </div>
        </Variant>
      </Variants>
      <Facts
        accessibility={[
          [
            'Link',
            <>One {code('a')}reads &quot;Edit, Surname, Given names&quot;.</>,
          ],
          [
            'Dates',
            'The lines are hidden from a screen reader. A hidden text reads them in words, such as "Mar. about 1875, div. in 1890".',
          ],
        ]}
        label='Relationship row'
        measurements={[
          ['Height', 'At least 52', 'size.row-l'],
          [
            'Grid',
            'Name, 240 dates, 72 Edit; gap 16; padding 8 20',
            'space.16 · space.8 · space.20',
          ],
          ['Dates', 'Mono; the spouse line under the other', 'type.mono'],
          ['Subtype', 'Small, under the name', 'type.small'],
        ]}
      />
    </DesktopOnly>
  </Section>
);

export const PickerRows = () => (
  <Section
    desktopPart={2}
    lead='One Person in a picker: the name, the note, and the line of dates. The whole row is one button that picks the Person.'
    title='Picker row'>
    <DesktopOnly>
      <Variants>
        <Variant caption='No note · the name and the line.'>
          <div className={styles.personRow} inert>
            <PickerRow
              {...DATES.range}
              givenNames='Hendrik Willem'
              surname='Botha'
            />
          </div>
        </Variant>
        <Variant caption='Maiden name · "née {maiden}".'>
          <div className={styles.personRow} inert>
            <PickerRow
              {...DATES.range}
              givenNames='Susanna'
              maidenName='Fourie'
              surname='Botha'
            />
          </div>
        </Variant>
        <Variant caption='Both notes · joined by " · ".'>
          <div className={styles.personRow} inert>
            <PickerRow
              {...DATES.range}
              givenNames='Maria Magdalena'
              maidenName='Rossouw'
              matchedVariant='Dutoit'
              surname='du Toit'
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
            ['Pressed · segment fill', 'active'],
          ] as const
        ).map(([caption, state]) => (
          <Variant caption={caption} key={caption}>
            <div className={styles.personRow} inert>
              <PickerRow
                {...DATES.range}
                givenNames='Anna Catharina'
                state={state}
                surname='le Roux'
              />
            </div>
          </Variant>
        ))}
      </Variants>
      <Facts
        accessibility={[
          [
            'Role',
            <>
              One {code('button')}of type {code('button')}that picks the Person.
            </>,
          ],
          [
            'Dates',
            'The line is hidden from a screen reader. A hidden text reads the dates in words.',
          ],
          [
            'Keyboard',
            <>
              Tab to reach, Enter or Space to pick. Focus shows the ring only on{' '}
              {code(':focus-visible.')}
            </>,
          ],
        ]}
        label='Picker row'
        measurements={[
          ['Height', 'At least 52', 'size.row-l'],
          [
            'Grid',
            'Name, 200 dates; gap 16; padding 8 20',
            'space.16 · space.8 · space.20',
          ],
          ['Name', 'Title, with the note in Small', 'type.title · type.small'],
          ['Hover', 'surface-2 fill', 'colour.surface-2'],
          ['Pressed', 'segment fill', 'colour.segment'],
        ]}
      />
    </DesktopOnly>
  </Section>
);
