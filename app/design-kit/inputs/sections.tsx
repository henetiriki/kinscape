import { Alert } from '@/app/components/Alert';
import { Button } from '@/app/components/Button';
import { CheckboxField } from '@/app/components/CheckboxField';
import { Chip, RemovableChip } from '@/app/components/Chip';
import { Divider } from '@/app/components/Divider';
import {
  EVENT_GLYPHS,
  EventGlyph,
  type EventType,
} from '@/app/components/EventGlyph';
import { KeyHint } from '@/app/components/KeyHint';
import { SelectField } from '@/app/components/SelectField';
import { Tabs } from '@/app/components/Tabs';
import { TextField } from '@/app/components/TextField';
import { TokenField } from '@/app/components/TokenField';

import {
  type Column,
  Facts,
  Matrix,
  Section,
  stateOf,
  Variant,
  Variants,
} from './Board';
import styles from './page.module.css';

const code = (text: string) => <code>{text}</code>;

export const Buttons = () => (
  <Section
    lead='Primary for the one action a view is for, secondary for everything else. Pick the height from where the button sits, not from how important it is.'
    part={1}
    title='Buttons'>
    <Variants>
      <Variant caption='50 · sign-in. Full width of the form (360 on desktop, the screen less the gutters on a phone), 16 / 600 label.'>
        <div className={styles.wide}>
          <Button full size='l' variant='primary'>
            Sign in
          </Button>
        </div>
      </Variant>
      <Variant caption='44 · panels and the dock. Clear filters in the Filters tab.'>
        <Button>Clear filters</Button>
      </Variant>
      <Variant caption='40 · inside cards on desktop. The empty-date notice card.'>
        <span className={styles.pair}>
          <Button size='s' variant='primary'>
            Jump to 1898
          </Button>
          <Button size='s'>Clear filters</Button>
        </span>
      </Variant>
      <Variant caption='Leading icon · Copy chain in the desktop popup: 36 tall, 14 / 600, 14px copy icon, 8 from the label. Its hit area is 44 × 44.'>
        <Button icon='copy' size='xs'>
          Copy chain
        </Button>
      </Variant>
      <Variant caption='Leading icon, round · Play in the desktop dock: 44 tall, fully round, 16px play icon.'>
        <Button icon='play' round variant='primary'>
          Play
        </Button>
      </Variant>
      <Variant caption='Icon only, round primary · Play on a phone. 44 × 44.'>
        <Button icon='play' label='Play through time' round variant='primary' />
      </Variant>
    </Variants>
    <Matrix
      label='Button states'
      rows={[
        {
          hint: '40 desktop, 44 phone',
          name: 'Primary, card',
          render: column => (
            <Button
              disabled={column === 'disabled'}
              size='s'
              state={stateOf(column)}
              variant='primary'>
              Jump to 1898
            </Button>
          ),
        },
        {
          hint: 'Cards, panels and the popup',
          name: 'Secondary',
          render: column => (
            <Button
              disabled={column === 'disabled'}
              size='s'
              state={stateOf(column)}>
              Clear filters
            </Button>
          ),
        },
        {
          hint: 'Round, leading icon',
          name: 'Play',
          render: column => (
            <Button
              disabled={column === 'disabled'}
              icon='play'
              round
              state={stateOf(column)}
              variant='primary'>
              Play
            </Button>
          ),
        },
        {
          hint: 'Phone',
          name: 'Play, icon only',
          render: column => (
            <Button
              disabled={column === 'disabled'}
              icon='play'
              label='Play through time'
              round
              state={stateOf(column)}
              variant='primary'
            />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            A real {code('button')}. Sign in is {code('type="submit"')}; the
            rest are {code('type="button"')}.
          </>,
        ],
        [
          'Name',
          <>
            The visible label. An icon-only Button must be given a{' '}
            {code('label')}: the type check fails without one. Icons are{' '}
            {code('aria-hidden')}.
          </>,
        ],
        [
          'Keyboard',
          <>
            Tab to reach, Enter or Space to press. Focus shows the ring only on{' '}
            {code(':focus-visible')}.
          </>,
        ],
        ['Hit area', 'The 36px button keeps a 44 × 44 hit area, as Chip does.'],
      ]}
      label='Buttons'
      measurements={[
        [
          'Height',
          '50 sign-in · 44 panels, dock and Play · 40 inside desktop cards · 36 Copy chain',
          'size.control-l · control · control-s · control-xs',
        ],
        ['Radius', '8 · Play fully round', 'radius.control · radius.full'],
        [
          'Padding',
          '0 16 · 0 16 0 12 Play · 0 12 Copy chain',
          'space.16 · space.12',
        ],
        [
          'Label',
          '16 / 24 · 600 sign-in · 14 / 20 · 600 everywhere else',
          'type.button · type.button-s',
        ],
        [
          'Icon',
          '20 sign-in · 16 · 14 Copy chain, 8 from the label',
          'space.8',
        ],
        [
          'Colours',
          'Primary: brand, white text. Secondary: white, 1px line-strong, ink',
          'colour.brand · colour.line-strong',
        ],
        [
          'Focus',
          '2px outline, 2px outside',
          'focus.width · focus.offset · colour.focus-ring',
        ],
      ]}
    />
  </Section>
);

const FIELD_TEXT: Partial<Record<Column, string>> = {
  active: 'field-notes-1901',
  focus: 'field-notes-19',
};

export const TextFields = () => (
  <Section
    lead='For anything typed or picked. Sign-in fields are 48 tall; everything in the app is 44.'
    part={1}
    title='Text fields'>
    <Variants>
      <Variant caption='48 · sign-in. Label 14 / 600, 8 above the field; text 16; padding 0 12.'>
        <div className={styles.field}>
          <TextField
            label='Email'
            placeholder='you@example.com'
            size='l'
            type='email'
          />
        </div>
      </Variant>
      <Variant caption='44 · app. As board 04: padding 0 12, text 15 (16 on a phone).'>
        <div className={styles.field}>
          <TextField
            hideLabel
            label='Search places'
            placeholder='Search places'
          />
        </div>
      </Variant>
      <Variant caption='Password, hidden. The eye button is 44 × 44 inside the 48 field.'>
        <div className={styles.field}>
          <TextField
            defaultValue='field-notes-1901'
            label='Password'
            size='l'
            type='password'
          />
        </div>
      </Variant>
      <Variant caption='Select · Person and Branch. Label 14 / 600, 8 above; padding 0 12; text 15; chevron 18.'>
        <span className={styles.pair}>
          <div className={styles.field}>
            <SelectField
              label='Person'
              options={[
                { label: 'Anyone', value: 'anyone' },
                { label: 'Maria Rossouw', value: 'maria' },
              ]}
            />
          </div>
          <div className={styles.field}>
            <SelectField
              label='Branch'
              options={[
                { label: 'Everyone', value: 'everyone' },
                { label: 'Paternal', value: 'paternal' },
              ]}
            />
          </div>
        </span>
      </Variant>
      <Variant caption='Search field · desktop search bar. 340 wide, surface-2 fill, no border, "/" key hint.'>
        <div className={styles.search}>
          <TextField
            hideLabel
            label='Search people and places'
            placeholder='Search people and places'
            shortcut='/'
            type='search'
          />
        </div>
      </Variant>
      <Variant caption='Token field · Surname. Chips 30 tall; the × is 26 × 26. Helper text under it.'>
        <div className={styles.tokens}>
          <TokenField
            defaultValues={['Rossouw']}
            helper='Matches spelling variants too (Rossouw, Rossau)'
            label='Surname'
            placeholder='Add a surname'
          />
        </div>
      </Variant>
      <Variant caption='Helper and error text, as board 05. The error replaces the helper; 2px error-border and icon.'>
        <span className={styles.pair}>
          <div className={styles.field}>
            <TextField
              helper='Helper text sits here in ink-3.'
              label='Email'
              readOnly
              size='l'
              type='email'
              value='researcher@example.com'
            />
          </div>
          <div className={styles.field}>
            <TextField
              error='Add the rest of the address, like name@example.com.'
              label='Email'
              readOnly
              size='l'
              type='email'
              value='researcher@example'
            />
          </div>
        </span>
      </Variant>
    </Variants>
    <Matrix
      label='Field states'
      rows={[
        {
          hint: '48; pressed shows it typed and shown',
          name: 'Password',
          render: column => (
            <div className={styles.cellField}>
              <TextField
                defaultValue={FIELD_TEXT[column] ?? 'field-notes'}
                disabled={column === 'disabled'}
                label={`Password, ${column}`}
                size='l'
                state={stateOf(column)}
                type='password'
              />
            </div>
          ),
        },
        {
          hint: 'Pressed is the open list',
          name: 'Select',
          render: column => (
            <div className={styles.cellField}>
              <SelectField
                disabled={column === 'disabled'}
                label={`Person, ${column}`}
                options={[{ label: 'Anyone', value: 'anyone' }]}
                state={stateOf(column)}
              />
            </div>
          ),
        },
        {
          hint: '340 wide on desktop',
          name: 'Search',
          render: column => (
            <div className={styles.cellField}>
              <TextField
                disabled={column === 'disabled'}
                hideLabel
                label={`Search, ${column}`}
                placeholder='Search people'
                state={stateOf(column)}
                type='search'
              />
            </div>
          ),
        },
        {
          hint: 'The × is the control inside',
          name: 'Token field',
          render: column => (
            <div className={styles.cellField}>
              <TokenField
                defaultValues={['Rossouw']}
                disabled={column === 'disabled'}
                label={`Surname, ${column}`}
                state={stateOf(column)}
              />
            </div>
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Name',
          <>
            A visible label tied with {code('for')}; a search field without one
            carries {code('aria-label')}.
          </>,
        ],
        [
          'Password',
          <>
            The eye is a button named &quot;Show password&quot; or &quot;Hide
            password&quot;; pressing it switches the field between{' '}
            {code('password')} and {code('text')}.
          </>,
        ],
        [
          'Search',
          <>
            {code('aria-keyshortcuts')} names the key; the hint is{' '}
            {code('aria-hidden')}. The key focuses the field unless a text input
            has focus.
          </>,
        ],
        [
          'Token field',
          <>
            Each chip has a &quot;Remove &lt;value&gt;&quot; button. Removing
            moves focus to the input. Enter adds the trimmed text; Backspace in
            the empty input removes the last chip.
          </>,
        ],
      ]}
      label='Text fields'
      measurements={[
        [
          'Height',
          '48 sign-in · 44 in the app, including select, search and token field',
          'size.field-l · size.field',
        ],
        ['Padding', '0 12 · 2px border on focus or error, so 0 11', 'space.12'],
        ['Text', '16 sign-in · 15 app (16 on a phone)', 'type.body-l'],
        [
          'Eye button',
          '44 × 44, 20px icon, 10 past the field padding',
          'size.touch',
        ],
        [
          'Search',
          'surface-2 fill, no border until focus; icon 18, "/" in mono 12',
          'colour.surface-2 · type.mono',
        ],
        [
          'Token field',
          'min 44 tall; chips 30; the × is 26 with a 44 hit area',
          'size.field',
        ],
      ]}
    />
  </Section>
);

const EVENTS: { label: string; on: boolean; type: EventType }[] = [
  { label: 'Birth', on: true, type: 'birth' },
  { label: 'Baptism', on: false, type: 'baptism' },
  { label: 'Residence', on: true, type: 'residence' },
  { label: 'Marriage', on: true, type: 'marriage' },
  { label: 'Death', on: false, type: 'death' },
  { label: 'Burial', on: false, type: 'burial' },
  { label: 'Land', on: true, type: 'land' },
  { label: 'Occupation', on: false, type: 'occupation' },
  { label: 'Other', on: false, type: 'other' },
];

export const Chips = () => (
  <Section
    lead='Event type filters, each with its glyph, and the removable chip a token field holds.'
    part={1}
    title='Chips'>
    <Variants>
      <Variant caption='All nine event types, some on and some off. 36 tall in the desktop panel, with a 44 hit area.'>
        <span className={styles.chips}>
          {EVENTS.map(({ label, on, type }) => (
            <Chip glyph={type} key={type} on={on}>
              {label}
            </Chip>
          ))}
        </span>
      </Variant>
      <Variant caption='Removable chip · Surname. 30 tall; the × is a 26 × 26 button with a 44 × 44 hit area.'>
        <RemovableChip value='Rossouw' />
      </Variant>
      <Variant caption='Event glyphs · 12, 14 and 16px, in pin colour. Always hidden from assistive tech.'>
        <span className={styles.glyphs}>
          {([12, 14, 16] as const).map(size => (
            <span className={styles.glyphRow} key={size}>
              {(Object.keys(EVENT_GLYPHS) as EventType[]).map(type => (
                <EventGlyph event={type} key={type} size={size} />
              ))}
            </span>
          ))}
        </span>
      </Variant>
    </Variants>
    <Matrix
      label='Chip states'
      rows={[
        {
          hint: 'Glyph stays pin-coloured',
          name: 'Event chip, off',
          render: column => (
            <Chip
              disabled={column === 'disabled'}
              glyph='baptism'
              on={false}
              state={stateOf(column)}>
              Baptism
            </Chip>
          ),
        },
        {
          hint: 'Brand tint and border',
          name: 'Event chip, on',
          render: column => (
            <Chip
              disabled={column === 'disabled'}
              glyph='birth'
              on
              state={column === 'focus' ? undefined : stateOf(column)}>
              Birth
            </Chip>
          ),
        },
        {
          hint: 'State shown on the ×',
          name: 'Removable chip',
          render: column => (
            <RemovableChip
              disabled={column === 'disabled'}
              state={stateOf(column)}
              value='Rossouw'
            />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Event chip',
          <>
            A toggle button: {code('aria-pressed')} says on or off. The glyph is{' '}
            {code('aria-hidden')}; the word names it.
          </>,
        ],
        [
          'Removable chip',
          <>
            The × is a button named &quot;Remove Rossouw&quot;. Pressing it
            removes the chip and moves focus to the field&apos;s input.
          </>,
        ],
        ['Hit area', '44 × 44 around the chip and around the ×.'],
      ]}
      label='Chips'
      measurements={[
        ['Height', '36 event chip · 30 removable chip', 'size.chip'],
        ['Radius', 'Fully round', 'radius.full'],
        [
          'Padding',
          '0 12 · removable 0 4 0 12, 4 before the ×',
          'space.12 · space.4',
        ],
        ['Label', '13.5 / 20 · 600 on, 400 off', 'type.chip'],
        ['Glyph', '14, 8 from the label, in pin', 'colour.pin'],
      ]}
    />
  </Section>
);

export const TabsSection = () => (
  <Section
    lead='Switch between the Layers and Filters panels. The Filters tab counts the filters that are on.'
    part={2}
    title='Tabs'>
    <Variants>
      <Variant caption='A count badge on Filters: named "Filters, 1 active".'>
        <Tabs
          label='Panels'
          selected='filters'
          tabs={[
            { label: 'Layers', value: 'layers' },
            { count: 1, label: 'Filters', value: 'filters' },
          ]}
        />
      </Variant>
      <Variant caption='No filters on: no badge.'>
        <Tabs
          label='Panels, none active'
          selected='layers'
          tabs={[
            { label: 'Layers', value: 'layers' },
            { label: 'Filters', value: 'filters' },
          ]}
        />
      </Variant>
    </Variants>
    <Matrix
      label='Tab states'
      rows={[
        {
          hint: 'State shown on "Filters"',
          name: 'Tab with count',
          render: column => (
            <Tabs
              disabled={column === 'disabled'}
              label={`Panels, ${column}`}
              selected='layers'
              tabs={[
                { label: 'Layers', value: 'layers' },
                {
                  count: 2,
                  label: 'Filters',
                  state: stateOf(column),
                  value: 'filters',
                },
              ]}
            />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('tablist')} of {code('tab')} buttons. The panel belongs to the
            screen; a Tab only takes its id as {code('aria-controls')}.
          </>,
        ],
        [
          'Name',
          'The label and the count, "Filters, 1 active". The badge is hidden from assistive tech.',
        ],
        [
          'Keyboard',
          'Only the selected tab is in the tab order. Left and Right move to the next tab, select it and wrap at the ends.',
        ],
      ]}
      label='Tabs'
      measurements={[
        ['Height', '40, with a 44 hit area', 'size.control-s'],
        ['Padding', '0 16, 8 before the badge', 'space.16 · space.8'],
        [
          'Badge',
          '20 tall pill, brand fill, white overline text',
          'colour.brand',
        ],
        ['Selected', 'brand-tint fill, brand-hover text', 'colour.brand-tint'],
      ]}
    />
  </Section>
);

export const CheckboxFields = () => (
  <Section
    lead='A checkbox with its label and, when it needs one, a line of description.'
    part={2}
    title='Checkbox field'>
    <Variants>
      <Variant caption='With a description. The checkbox points to it with aria-describedby.'>
        <CheckboxField
          description='Only people with a recorded death.'
          label='Deceased only'
        />
      </Variant>
      <Variant caption='Label only.'>
        <CheckboxField defaultChecked label='Show district borders' />
      </Variant>
      <Variant caption='Disabled.'>
        <CheckboxField
          description='Not available before 1652.'
          disabled
          label='Show polities'
        />
      </Variant>
    </Variants>
    <Matrix
      label='Checkbox field states'
      rows={[
        {
          hint: 'Off and on',
          name: 'With description',
          render: column => (
            <CheckboxField
              description='Only people with a recorded death.'
              disabled={column === 'disabled'}
              label='Deceased only'
              state={stateOf(column)}
            />
          ),
        },
        {
          hint: 'Label only',
          name: 'Label only',
          render: column => (
            <CheckboxField
              defaultChecked
              disabled={column === 'disabled'}
              label='Show borders'
              state={stateOf(column)}
            />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Name',
          'The label, tied to the checkbox; clicking the label text toggles the box.',
        ],
        [
          'Description',
          <>Tied with {code('aria-describedby')}. It is not a live region.</>,
        ],
        ['Hit area', 'The 20px box has a 44 × 44 hit area.'],
      ]}
      label='Checkbox field'
      measurements={[
        ['Box', '20, 4 radius, 1.5 border', 'size.checkbox · radius.small'],
        ['Gap', '12 between box and text', 'space.12'],
        ['Label', '14 / 20 · 600', 'type.label'],
        ['Description', '13 / 20, ink-3', 'type.small'],
      ]}
    />
  </Section>
);

export const Alerts = () => (
  <Section
    lead='For a problem with one part of the screen. Use the untitled form when the message says it all.'
    part={2}
    title='Alerts'>
    <Variants>
      <Variant caption='Titled.'>
        <div className={styles.alert}>
          <Alert title='Boundaries missing' tone='warning'>
            No borders are mapped for 1750 yet.
          </Alert>
        </div>
      </Variant>
      <Variant caption='Untitled: the message alone, with the same tone, border and role.'>
        <div className={styles.alert}>
          <Alert tone='warning'>No borders are mapped for 1750 yet.</Alert>
        </div>
      </Variant>
      <Variant caption='Untitled, every tone.'>
        <div className={styles.alert}>
          <Alert tone='error'>The export didn&apos;t finish.</Alert>
          <Alert tone='success'>Jurisdiction chain copied.</Alert>
          <Alert tone='info'>Switched to month precision.</Alert>
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="alert"')} for an error; {code('role="status"')} for the
            rest. A title does not change it.
          </>,
        ],
      ]}
      label='Alerts'
      measurements={[
        ['Padding', '12 14, 12 between icon and text', 'space.12'],
        ['Radius', '8, 1px tone border', 'radius.control'],
        ['Text', 'Title 14 / 600 · message 13.5', 'type.small'],
      ]}
    />
  </Section>
);

export const Dividers = () => (
  <Section
    lead='Separate groups of controls. The word form sits between two choices, as sign-in does.'
    part={2}
    title='Dividers'>
    <Variants>
      <Variant caption='Hairline · 1px line.'>
        <div className={styles.divider}>
          <Divider />
        </div>
      </Variant>
      <Variant caption='With a word · "or" between Google and email sign-in.'>
        <div className={styles.divider}>
          <Divider label='or' />
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>The hairline is a separator; the word form is plain text.</>,
        ],
      ]}
      label='Dividers'
      measurements={[
        ['Line', '1px, line colour', 'colour.line'],
        ['Word', '13 / 20, ink-3, 12 from each line', 'type.small · space.12'],
      ]}
    />
  </Section>
);

export const KeyHints = () => (
  <Section
    lead='Show a keyboard shortcut next to what it does. Desktop only: phones have no keyboard to hint at.'
    part={2}
    title='Key hints'>
    <Variants>
      <Variant caption='In the search field.'>
        <KeyHint decorative>/</KeyHint>
      </Variant>
      <Variant caption='In the dock hints, inside 12.5 / 18 ink-3 text. The same key as in the search field.'>
        <span className={styles.hintLine}>
          <KeyHint>←</KeyHint>
          <KeyHint>→</KeyHint>1 year · with <KeyHint>Shift</KeyHint>×10
        </span>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        ['Element', <>A {code('kbd')}.</>],
        [
          'Search',
          <>
            The &quot;/&quot; hint is {code('aria-hidden')}; the field carries{' '}
            {code('aria-keyshortcuts="/"')} instead.
          </>,
        ],
        ['Dock', 'Read as the sentence it sits in, so it is not hidden.'],
      ]}
      label='Key hints'
      measurements={[
        ['Text', 'JetBrains Mono 12 / 16', 'type.mono'],
        ['Padding', '2 4 · gap 8 in the dock line', 'space.4 · space.8'],
        [
          'Border',
          '1px line-strong, radius 4',
          'colour.line-strong · radius.small',
        ],
        ['Colour', 'ink-3', 'colour.ink-3'],
      ]}
    />
  </Section>
);
