import type { ReactNode } from 'react';

import type { Tab } from '@ks/app/components/actions/types';
import type { EventType } from '@ks/app/components/map/types';
import type { Column } from '@ks/app/design-kit/inputs/types';

import { Button } from '@ks/app/components/actions/Button';
import { Chip, RemovableChip } from '@ks/app/components/actions/Chip';
import { KeyHint } from '@ks/app/components/actions/KeyHint';
import { Tabs } from '@ks/app/components/actions/Tabs';
import { Alert } from '@ks/app/components/feedback/Alert';
import { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TextField } from '@ks/app/components/forms/TextField';
import { TokenField } from '@ks/app/components/forms/TokenField';
import { Divider } from '@ks/app/components/foundation/Divider';
import { Surface } from '@ks/app/components/foundation/Surface';
import { SheetPanel } from '@ks/app/components/overlays/Sheet';
import {
  ByViewport,
  DesktopOnly,
  Facts,
  Matrix,
  Section,
  stateOf,
  Variant,
  Variants,
} from '@ks/app/design-kit/inputs/Board';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

import styles from '@ks/app/design-kit/inputs/page.module.css';

// The board keeps the space after a code inside it, so the space is set in mono too.
const code = (text: string) => <code>{`${text} `}</code>;

// The Tabs samples sit on the map's sea colour, as the board draws them.
const { map } = resolveTokens(rawTokens);

const HitTag = () => <span className={styles.hitTag}>44 × 44 hit area</span>;

export const Buttons = () => (
  <Section
    lead='Primary for the one action a view is for, secondary for everything else. Pick the height from where the button sits, not from how important it is.'
    part={1}
    title='Buttons'>
    <Variants>
      <Variant caption='L 50 · sign-in. Full width of the form (360 on desktop, the screen less the gutters on a phone), 16 / 24 label.'>
        <div className={styles.wide}>
          <Button full size='l' variant='primary'>
            Sign in
          </Button>
        </div>
      </Variant>
      <Variant caption='M 44 · panels and the dock, 15 / 22 label. Clear filters in the Filters tab.'>
        <Button>Clear filters</Button>
      </Variant>
      <Variant
        caption={
          <ByViewport
            desktop='S 40 · inside cards on desktop, 14 / 20 label. The empty-date notice card.'
            phone='M 44 · inside cards on a phone. The empty-date notice card.'
          />
        }>
        <span className={`${styles.buttons} ${styles.cardButton}`}>
          <Button size='s' variant='primary'>
            Jump to 1898
          </Button>
          <Button size='s'>Clear filters</Button>
        </span>
      </Variant>
      <Variant
        caption='XS 36 · Copy chain in the desktop popup: 14 / 20 label, padding 12, 14px copy icon 8 from the label.'
        desktop>
        <span className={styles.tagged}>
          <Button icon='copy' size='xs'>
            Copy chain
          </Button>
          <HitTag />
        </span>
      </Variant>
      <Variant
        caption='M 44, round · Play in the desktop dock: fully round, 16px play icon.'
        desktop>
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
            <span className={styles.cardButton}>
              <Button
                disabled={column === 'disabled'}
                size='s'
                state={stateOf(column)}
                variant='primary'>
                Jump to 1898
              </Button>
            </span>
          ),
        },
        {
          hint: 'Cards, panels and the popup',
          name: 'Secondary',
          render: column => (
            <span className={styles.cardButton}>
              <Button
                disabled={column === 'disabled'}
                size='s'
                state={stateOf(column)}>
                Clear filters
              </Button>
            </span>
          ),
        },
        {
          desktop: true,
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
            A real {code('button.')}Sign in is {code('type="submit";')}the rest
            are {code('type="button".')}
          </>,
        ],
        [
          'Name',
          <>
            The visible label. Icon-only Play has{' '}
            {code('aria-label="Play through time",')}which becomes &quot;Pause
            through time&quot; while it plays. Icons are {code('aria-hidden.')}
          </>,
        ],
        [
          'Keyboard',
          <>
            Tab to reach, Enter or Space to press. Focus shows the ring only on{' '}
            {code(':focus-visible.')}
          </>,
        ],
      ]}
      label='Buttons'
      measurements={[
        [
          'Height',
          'L 50 sign-in · M 44 panels, dock and Play · S 40 inside desktop cards (M 44 on a phone) · XS 36 Copy chain, with a 44 × 44 hit area',
          'size.control-l · size.control · size.control-s · size.control-xs',
        ],
        [
          'Radius',
          '8 · Play fully round (22 on a 44 button)',
          'radius.control · radius.full',
        ],
        [
          'Padding',
          'M and S 0 16 · Play 0 16 0 12 · XS 0 12 · L fills the form',
          'space.16 · space.12',
        ],
        [
          'Label',
          'L 16 / 24 · M 15 / 22 · S and XS 14 / 20, all 600',
          'type.button · type.control · type.button-s',
        ],
        ['Icon', '16 Play · 14 Copy chain, 8 from the label', 'space.8'],
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

const PERSON = [{ label: 'Anyone', value: 'anyone' }];

// The board draws a hidden password as ten dots, and a shown one as this text.
const HIDDEN = 'notes-1901';
const TYPED = 'field-notes-1901';

export const TextFields = () => (
  <Section
    lead='For anything typed or picked. Two sizes: L 48 on sign-in, M 44 everywhere in the app.'
    part={1}
    title='Text fields'>
    <Variants>
      <Variant caption='L 48 · sign-in. Label 14 / 20 · 600, 8 above the field; text 16 / 24; padding 0 12.'>
        <div className={styles.field}>
          <TextField
            label='Email'
            placeholder='you@example.com'
            size='l'
            type='email'
          />
        </div>
      </Variant>
      <Variant
        caption={
          <ByViewport
            desktop='M 44 · app. As board 04: padding 0 12, text 15 / 22 (16 / 24 on a phone).'
            phone='M 44 · app. As board 04: padding 0 12, text 16 / 24 on a phone.'
          />
        }>
        <div className={styles.fieldM}>
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
            defaultValue={HIDDEN}
            label='Password'
            size='l'
            type='password'
          />
        </div>
      </Variant>
      <Variant caption='Password, shown. Same button, eye-off icon, label "Hide password".'>
        <div className={styles.field}>
          <TextField
            defaultShown
            defaultValue={TYPED}
            label='Password'
            size='l'
            type='password'
          />
        </div>
      </Variant>
      <Variant caption='Select · Person and Branch, M 44. Label 14 / 20 · 600, 8 above; padding 0 12; chevron 18.'>
        <span className={styles.pair}>
          <div className={styles.fieldM}>
            <SelectField label='Person' options={PERSON} />
          </div>
          <div className={styles.fieldM}>
            <SelectField
              label='Branch'
              options={[{ label: 'Everyone', value: 'everyone' }]}
            />
          </div>
        </span>
      </Variant>
      <Variant
        caption='Search field · desktop search bar. 340 wide, surface-2 fill, no border, "/" key hint. On a phone the field sits bare inside the search pill (board 08).'
        desktop>
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
      <Variant
        caption={
          <ByViewport
            desktop='Token field · Surname. Chips 30 tall; the × is 26 × 26. Helper text under it.'
            phone='Token field · Surname. Chips 36 tall; the × is 36 × 36. Helper text under it.'
          />
        }>
        <div className={`${styles.tokens} ${styles.phoneChips}`}>
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
          <div className={styles.messageField}>
            <TextField
              helper='Helper text sits here in ink-3.'
              label='Email'
              readOnly
              size='l'
              type='email'
              value='researcher@example.com'
            />
          </div>
          <div className={styles.messageField}>
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
                defaultShown={column === 'active'}
                defaultValue={column === 'active' ? TYPED : HIDDEN}
                disabled={column === 'disabled'}
                hideLabel
                label={`Password, ${column}`}
                size='l'
                state={column === 'active' ? undefined : stateOf(column)}
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
                hideLabel
                label={`Person, ${column}`}
                options={PERSON}
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
          'Label',
          <>
            Every field has a visible {code('<label for>.')}Search has no
            visible label, so it takes{' '}
            {code('aria-label="Search people and places".')}
          </>,
        ],
        [
          'Password',
          <>
            The eye is a {code('button type="button":')}
            {code('aria-label="Show password",')}then &quot;Hide password&quot;
            while shown. The field switches between {code('type="password"')}
            and {code('type="text".')}After a failed sign-in, clear it.
          </>,
        ],
        [
          'Select',
          <>
            A native {code('<select>,')}so arrow keys and Alt + Down work. The
            chevron is {code('aria-hidden.')}
          </>,
        ],
        [
          'Search',
          <>
            {code('type="search".')}The &quot;/&quot; hint is{' '}
            {code('aria-hidden;')}the field has {code('aria-keyshortcuts="/".')}
          </>,
        ],
        [
          'Token field',
          'The input is labelled "Surname". Each chip\'s × is a button named "Remove Rossouw". Enter adds a surname.',
        ],
        [
          'Errors',
          <>
            {code('aria-invalid="true",')}and {code('aria-describedby')}points
            at the error text.
          </>,
        ],
      ]}
      label='Text fields'
      measurements={[
        [
          'Height',
          'L 48 sign-in · M 44 in the app, including select, search and token field',
          'size.field-l · size.field',
        ],
        [
          'Border',
          '1px field-border; hover 1px ink-3; focus and error 2px (brand, error-border), padding 1 less to keep the text still. Search has no border',
          'colour.field-border · colour.ink-3 · colour.brand · colour.error-border',
        ],
        [
          'Radius',
          '8, the eye button too · chips fully round',
          'radius.control · radius.full',
        ],
        [
          'Padding',
          '0 12 · 0 56 0 12 with the eye (44 + 12) · token field 4 8',
          'space.12 · space.4 · space.8',
        ],
        [
          'Text',
          'L 16 / 24 · M 15 / 22, 16 / 24 on a phone',
          'type.body-l · type.body',
        ],
        ['Label', '14 / 20 · 600, 8 above the field', 'type.label · space.8'],
        [
          'Chip in a field',
          <ByViewport
            desktop='30 tall, × 26 × 26 with a 44 × 44 hit area, brand-tint, brand-hover text 13.5 / 600'
            key='value'
            phone='36 tall, brand-tint, brand-hover text 13.5 / 600'
          />,
          <ByViewport
            desktop='size.chip-s · size.chip-remove · colour.brand-tint · type.chip'
            key='token'
            phone='size.chip · colour.brand-tint · type.chip'
          />,
        ],
        [
          'Helper, error',
          <ByViewport
            desktop='12.5 / 18 ink-3 in the panel, 13 / 20 on sign-in; error 13 / 20 in error'
            key='value'
            phone='13 / 20 ink-3; error 13 / 20 in error'
          />,
          'type.small · type.caption · colour.error',
        ],
        [
          'Icons',
          'search 18 · chevron 18 · eye 20 · error 18, 12 from the right; stroke 2',
          <em className={styles.noToken} key='token'>
            no token
          </em>,
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
  { label: 'Divorce', on: false, type: 'divorce' },
  { label: 'Death', on: false, type: 'death' },
  { label: 'Burial', on: false, type: 'burial' },
  { label: 'Land', on: false, type: 'land' },
  { label: 'Occupation', on: false, type: 'occupation' },
  { label: 'Other', on: false, type: 'other' },
];

export const Chips = () => (
  <Section
    lead='Event type filters, each with its glyph, and the removable chip a token field holds.'
    part={1}
    title='Chips'>
    <Variants>
      <Variant
        caption={
          <ByViewport
            desktop='All ten event types, some on and some off. 36 tall in the desktop panel, with a 44 hit area.'
            phone='All ten event types, some on and some off. 44 tall on a phone.'
          />
        }>
        <span className={`${styles.chips} ${styles.phoneChips}`}>
          {EVENTS.map(({ label, on, type }) => (
            <Chip glyph={type} key={type} on={on}>
              {label}
            </Chip>
          ))}
        </span>
      </Variant>
      <Variant
        caption={
          <ByViewport
            desktop='Removable chip · Surname. 30 tall; the × is a 26 × 26 button.'
            phone='Removable chip · Surname. 36 tall; the × is a 36 × 36 button.'
          />
        }>
        <span className={`${styles.tagged} ${styles.phoneChips}`}>
          <RemovableChip value='Rossouw' />
          <HitTag />
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
            <span className={styles.phoneChips}>
              <Chip
                disabled={column === 'disabled'}
                glyph='birth'
                on={false}
                state={stateOf(column)}>
                Birth
              </Chip>
            </span>
          ),
        },
        {
          hint: 'aria-pressed="true"',
          name: 'Event chip, on',
          render: column => (
            <span className={styles.phoneChips}>
              <Chip
                disabled={column === 'disabled'}
                glyph='marriage'
                on
                state={stateOf(column)}>
                Marriage
              </Chip>
            </span>
          ),
        },
      ]}
    />
    <Matrix
      columns={[
        { column: 'default', title: 'Default' },
        { column: 'hover', title: 'Hover' },
        { column: 'focus', phoneTitle: 'Focus', title: 'Focus (keyboard)' },
        { column: 'active', title: 'Pressed' },
      ]}
      label='Removable chip states'
      rows={[
        {
          hint: 'States on the ×',
          name: 'Removable chip',
          render: column => (
            <span className={styles.phoneChips}>
              <RemovableChip state={stateOf(column)} value='Rossouw' />
            </span>
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            Event chips are toggle buttons: {code('button aria-pressed.')}The
            set sits in a {code('fieldset')}with the legend &quot;Event
            type&quot;.
          </>,
        ],
        [
          'Name',
          <>
            The event name. The glyph is {code('aria-hidden;')}the shape repeats
            what the word says.
          </>,
        ],
        [
          'Removable',
          <>
            The × is its own button, {code('aria-label="Remove Rossouw".')}When
            it goes, focus moves to the surname input.
          </>,
        ],
        ['Keyboard', 'Tab between chips, Space or Enter toggles.'],
      ]}
      label='Chips'
      measurements={[
        [
          'Height',
          <ByViewport
            desktop='36, fully round, in the desktop panel (a 44 hit area)'
            key='value'
            phone='44, fully round, on a phone'
          />,
          <ByViewport
            desktop='size.chip · radius.full'
            key='token'
            phone='size.touch · radius.full'
          />,
        ],
        ['Padding', '0 12 · glyph 8 from the label', 'space.12 · space.8'],
        [
          'Label',
          '13.5 / 20; 600 when on, 400 when off',
          'type.chip (on) · type.chip-off',
        ],
        [
          'Colours',
          'Off: white, 1px line-strong, ink-3. On: brand-tint, 1px brand, brand-hover. Glyph in pin',
          'colour.line-strong · colour.brand-tint · colour.brand · colour.pin',
        ],
        [
          'Removable',
          <ByViewport
            desktop='30 tall, padding 0 4 0 12; × 26 × 26 with a 44 × 44 hit area; 13.5 / 600 brand-hover on brand-tint'
            key='value'
            phone='36 tall, padding 0 0 0 12; × 36 × 36 with a 44 × 44 hit area; 13.5 / 600 brand-hover on brand-tint'
          />,
          <ByViewport
            desktop='size.chip-s · size.chip-remove · type.chip'
            key='token'
            phone='size.chip · type.chip'
          />,
        ],
        ['Gap', '8 between chips', 'space.8'],
      ]}
    />
  </Section>
);

const LAYERS: Tab = { label: 'Layers', value: 'layers' };

const FILTERS: Tab = { count: 1, label: 'Filters', value: 'filters' };

const Stage = ({
  children,
  sheet,
}: {
  children: ReactNode;
  /** A phone sheet rises from the bottom edge. */
  sheet?: boolean;
}) => (
  <div
    className={styles.stage}
    data-sheet={sheet || undefined}
    style={{ background: map.sea }}>
    {children}
  </div>
);

const PanelBar = ({ label, selected }: { label: string; selected: string }) => (
  <Stage>
    <span className={styles.panelBar}>
      <Tabs label={label} selected={selected} tabs={[LAYERS, FILTERS]} />
    </span>
  </Stage>
);

/** A cell of the Tab states: both tabs on a desktop, only Filters, 44 tall, on a phone. */
const tabStates = (selected: string, column: Column) => {
  const filters = { ...FILTERS, state: stateOf(column) };
  const label = `Panels, ${selected}, ${column}`;

  return (
    <ByViewport
      desktop={
        <Tabs
          disabled={column === 'disabled'}
          label={label}
          selected={selected}
          tabs={[LAYERS, filters]}
        />
      }
      phone={
        <Tabs
          disabled={column === 'disabled'}
          fill
          label={label}
          selected={selected}
          tabs={[filters]}
        />
      }
    />
  );
};

export const TabsSection = () => (
  <Section
    lead='Switch between the Layers and Filters panels. The badge counts the filters that are on.'
    part={2}
    title='Tabs'>
    <Variants>
      <Variant
        caption='Equal width in the 320 panel: Layers selected. Bar padding 4, gap 4, line under it.'
        desktop>
        <PanelBar label='Panels' selected='layers' />
      </Variant>
      <Variant
        caption='Filters selected, with the count badge: one filter is on.'
        desktop>
        <PanelBar label='Panels, Filters selected' selected='filters' />
      </Variant>
      <Variant caption='Phone sheet header: the tabs share the row with a 44 Close button. Tabs 44 tall.'>
        <Stage sheet>
          <Surface level='sheet'>
            <SheetPanel
              tabs={{
                label: 'Layers and filters',
                selected: 'layers',
                tabs: [LAYERS, FILTERS],
              }}
              titleId='tabs-sheet'>
              {null}
            </SheetPanel>
          </Surface>
        </Stage>
      </Variant>
    </Variants>
    <Matrix
      label='Tab states'
      rows={[
        {
          hint: 'State shown on "Filters" (off)',
          name: 'Tab with badge',
          phoneHint: 'Filters, not selected',
          render: column => tabStates('layers', column),
        },
        {
          hint: 'Filters selected',
          name: 'Tab with badge, on',
          render: column => tabStates('filters', column),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            A {code('tablist')}holding two {code('tab')}elements with{' '}
            {code('aria-selected,')}each controlling a {code('tabpanel.')}The
            mockups use {code('aria-pressed')}buttons.
          </>,
        ],
        [
          'Name',
          'The label plus the count: "Filters, 1 active". The badge alone would read as "Filters 1".',
        ],
        [
          'Keyboard',
          'Tab moves into the tablist; Left and Right move between tabs and select them.',
        ],
        [
          'Close',
          <>
            {code('aria-label="Close".')}It closes the sheet and returns focus
            to the Layers button.
          </>,
        ],
      ]}
      label='Tabs'
      measurements={[
        [
          'Height',
          <ByViewport
            desktop='40 in the desktop panel, 44 on a phone'
            key='value'
            phone='44 on a phone, 40 in the desktop panel'
          />,
          'size.control · size.control-s',
        ],
        [
          'Width',
          <>Equal: each tab takes half the row {code('(flex: 1)')}</>,
          <span className={styles.noToken} key='token'>
            —
          </span>,
        ],
        [
          'Bar',
          'Desktop: padding 4, gap 4, 1px line under it · phone: 8 under the row, gap 8 to Close',
          'space.4 · space.8 · colour.line',
        ],
        [
          'Label',
          '14 / 20 · 600; selected brand-hover on brand-tint, others ink-3',
          'type.label · colour.brand-tint · colour.brand-hover',
        ],
        [
          'Badge',
          '20 tall, min-width 20, fully round, brand, white 13.5 / 600; 8 after the label',
          'radius.full · colour.brand · type.chip · space.8',
        ],
        ['Radius', '8', 'radius.control'],
        [
          'Close',
          '44 × 44, fully round, ink-3, 20px icon',
          'size.touch · radius.full · colour.ink-3',
        ],
      ]}
    />
  </Section>
);

const PINS = 'Pins';

export const CheckboxFields = () => (
  <Section
    lead='A checkbox with its name, and on layer rows a line of live detail. Sign-in uses the plain label form.'
    part={2}
    title='Checkbox field'>
    <Variants>
      <Variant caption='Layer row, on. Name 14 / 600, description in ink-3.'>
        <div className={styles.checkboxRow}>
          <CheckboxField
            defaultChecked
            description='8 of 214 true on this date'
            label={PINS}
          />
        </div>
      </Variant>
      <Variant caption='Layer row, off.'>
        <div className={styles.checkboxRow}>
          <CheckboxField
            description='Drostdy and magisterial districts'
            label='Districts'
          />
        </div>
      </Variant>
      <Variant caption='While loading, the description says so.'>
        <div className={styles.checkboxRow}>
          <CheckboxField defaultChecked description='Loading…' label={PINS} />
        </div>
      </Variant>
      <Variant caption='Label only · sign-in. 20 box, 15 / 22 in ink-2, 12 between.'>
        <CheckboxField
          defaultChecked
          label='Keep me signed in on this device'
          plain
        />
      </Variant>
    </Variants>
    <Matrix
      label='Checkbox field states'
      rows={[
        {
          hint: 'Districts',
          name: 'Layer row, off',
          render: column => (
            <div className={styles.cellCheckbox}>
              <CheckboxField
                description='Drostdy districts'
                disabled={column === 'disabled'}
                label='Districts'
                state={stateOf(column)}
              />
            </div>
          ),
        },
        {
          hint: PINS,
          name: 'Layer row, on',
          render: column => (
            <div className={styles.cellCheckbox}>
              <CheckboxField
                defaultChecked
                description='8 of 214 true'
                disabled={column === 'disabled'}
                label={PINS}
                state={stateOf(column)}
              />
            </div>
          ),
        },
        {
          hint: 'Sign-in',
          name: 'Label only',
          render: column => (
            <div className={styles.cellCheckbox}>
              <CheckboxField
                defaultChecked
                disabled={column === 'disabled'}
                label='Keep me signed in on this device'
                plain
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
          'Role',
          <>
            A native {code('input type="checkbox"')}inside its{' '}
            {code('<label>,')}so clicking the text toggles it.
          </>,
        ],
        [
          'Name',
          <>
            The name. Tie the description with {code('aria-describedby')}so it
            is read after the name.
          </>,
        ],
        [
          'Live',
          'The description changes with the date ("8 of 214 true on this date"); it is not a live region, so it is read when focused, not on every change.',
        ],
        ['Keyboard', 'Tab to reach, Space toggles. Focus ring on the box.'],
      ]}
      label='Checkbox field'
      measurements={[
        [
          'Row',
          <ByViewport
            desktop='min-height 48; the whole row is the label, so all of it is the hit area · 44 in the Basemap and Pins groups on desktop'
            key='value'
            phone='min-height 48; the whole row is the label, so all of it is the hit area'
          />,
          <ByViewport
            desktop='size.field-l · size.touch'
            key='token'
            phone='size.field-l'
          />,
        ],
        [
          'Checkbox',
          '20 × 20 everywhere, radius 4, 1.5px field-border off, brand fill on',
          'size.checkbox · radius.small · colour.field-border · colour.brand',
        ],
        ['Gap', '12 between box and text', 'space.12'],
        ['Name', '14 / 20 · 600 ink', 'type.label'],
        [
          'Description',
          <ByViewport
            desktop='12.5 / 18 ink-3; live facts, such as pins true on the date'
            key='value'
            phone='13 / 20 ink-3; live facts, such as pins true on the date'
          />,
          <ByViewport
            desktop='type.caption · colour.ink-3'
            key='token'
            phone='type.small · colour.ink-3'
          />,
        ],
        ['Label only', '15 / 22 ink-2', 'type.body · colour.ink-2'],
      ]}
    />
  </Section>
);

export const Alerts = () => (
  <Section
    lead='For a problem with one part of the screen. Use the untitled form when the one line says it all.'
    part={2}
    title='Alerts'>
    <Variants>
      <Variant caption='Without a title · sign-in, above the fields. The same look as the titled alert on board 05: 1px error-border, 20px filled icon, one 13 / 20 line. For the titled form, see board 05.'>
        <div className={styles.alert}>
          <Alert tone='error'>
            That email and password don&apos;t match. Check them and try again.
          </Alert>
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="alert":')}a failed sign-in is an error. It is announced
            without moving focus.
          </>,
        ],
        [
          'Fields',
          <>
            Both fields get {code('aria-invalid="true"')}and a 2px error-border.
            The password is cleared, with the helper &quot;Password cleared
            after a failed attempt.&quot;
          </>,
        ],
        ['Icon', <>{code('aria-hidden;')}the words carry the meaning.</>],
      ]}
      label='Alerts'
      measurements={[
        ['Padding', '12 16 · radius 8', 'space.12 · space.16 · radius.control'],
        [
          'Border, fill, text',
          '1px error-border, error-bg, error text',
          'colour.error-border · colour.error-bg · colour.error',
        ],
        [
          'Icon',
          '20 filled circle in error-border, white "!", 12 from the text',
          'space.12',
        ],
        ['Text', '13 / 20', 'type.small'],
      ]}
    />
  </Section>
);

export const Dividers = () => (
  <Section
    lead="Separate groups that sit close together. Use space first; reach for a line when space alone doesn't read."
    part={2}
    title='Dividers'>
    <Variants>
      <Variant caption='Hairline · 1px line. Between menu groups, panel rows, popup rows.'>
        <div className={styles.divider}>
          <Divider />
        </div>
      </Variant>
      <Variant caption='"or" divider · sign-in, between Sign in and Continue with Google. Hidden with the Google button.'>
        <div className={styles.divider}>
          <Divider label='or' />
        </div>
      </Variant>
      <Variant caption='Rule above a footnote · sign-in, 20 above the text.'>
        <div className={styles.footnote}>
          <Divider />
          There&apos;s no sign-up. Accounts are set up by whoever runs this
          KinScape.
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Hairline',
          <>
            Decoration: a {code('span')}or an {code('hr')}with{' '}
            {code('aria-hidden,')}so it isn&apos;t read.
          </>,
        ],
        [
          '"or"',
          <>The word is read; the two lines are {code('aria-hidden.')}</>,
        ],
      ]}
      label='Dividers'
      measurements={[
        ['Line', '1px line', 'colour.line'],
        [
          '"or"',
          '13 / 20 ink-3, 12 from each line',
          'type.small · space.12 · colour.ink-3',
        ],
        [
          'Footnote',
          '20 between rule and text; 13 / 20 ink-3',
          'space.20 · type.small',
        ],
      ]}
    />
  </Section>
);

export const KeyHints = () => (
  <Section
    lead='Show a keyboard shortcut next to what it does. Desktop only: phones have no keyboard to hint at.'
    part={2}
    phoneLead='Desktop only: phones have no keyboard to hint at. See the desktop board.'
    title='Key hints'>
    <DesktopOnly>
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
    </DesktopOnly>
    <DesktopOnly>
      <Facts
        accessibility={[
          ['Element', <>A {code('<kbd>.')}</>],
          [
            'Search',
            <>
              The &quot;/&quot; hint is {code('aria-hidden;')}the field carries{' '}
              {code('aria-keyshortcuts="/"')}instead.
            </>,
          ],
          [
            'Dock',
            'Read as the sentence it sits in. The slider\'s own label already says "Arrow keys step one year, Shift and arrow ten years".',
          ],
        ]}
        label='Key hints'
        measurements={[
          ['Text', 'JetBrains Mono 12 / 16', 'type.mono'],
          [
            'Padding',
            '2 4 · gap 8 in the dock line',
            '2: no token · space.4 · space.8',
          ],
          [
            'Border',
            '1px line-strong, radius 4',
            'colour.line-strong · radius.small',
          ],
          ['Colour', 'ink-3', 'colour.ink-3'],
        ]}
      />
    </DesktopOnly>
  </Section>
);
