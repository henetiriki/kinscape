/** What each shared control's design system card shows (Spec #450): its group, height, `DESIGN.md` bullets and states. */

import type { Column } from '#ks/app/components/layout/types.ts';
import type { Card, Slot, State } from '#ks/lib/design/types.ts';

import { COLUMNS } from '#ks/app/components/layout/columns.mts';
import { SLOTS } from '#ks/app/components/layout/slots.mts';
import sources from '#ks/data/sources.json' with { type: 'json' };
import {
  CHAIN,
  CONTESTED_COUNT,
  CONTESTED_YEARS,
  EPOCHS,
  FILTER_BRANCHES,
  FILTER_EVENT_TYPES,
  FILTER_PEOPLE,
  FILTER_PEOPLE_WITH_ONE,
  FUZZY_DATE_HELPER,
  LAYER_GROUPS,
  LONG_NOTES,
  MAP_DATE,
  panelTabs,
  PINS,
  SURNAME_HELPER,
  TODAY,
} from '#ks/lib/design/samples.mts';
import { EVENT_TYPES } from '#ks/lib/domain/pins/schemas.mts';

const FOCUS = ['active', 'focus', 'hover'] as const;
const TABS = [
  { label: 'Layers', value: 'layers' },
  { count: 1, label: 'Filters', value: 'filters' },
  { label: 'More', value: 'more' },
];
const SEGMENTS = [
  { label: 'Map', value: 'map' },
  { label: 'List', value: 'list' },
];
const OPTIONS = [
  { glyph: 'birth', label: 'Birth', value: 'birth' },
  { glyph: 'death', label: 'Death', value: 'death' },
  { glyph: 'marriage', label: 'Marriage', value: 'marriage' },
];

const POLITIES = [
  { label: 'Cape', value: 'cape' },
  { label: 'Natal', value: 'natal' },
  { label: 'Transvaal', value: 'transvaal' },
];

const ICONS = [
  'alert',
  'back',
  'chevronDown',
  'close',
  'cloudOff',
  'copy',
  'document',
  'done',
  'error',
  'export',
  'eye',
  'eyeOff',
  'fit',
  'forward',
  'info',
  'layers',
  'menu',
  'people',
  'place',
  'play',
  'search',
  'signOut',
  'success',
  'warning',
  'zoomIn',
  'zoomOut',
];
const OTHERS = [
  'body',
  'bodyL',
  'button',
  'buttonS',
  'caption',
  'chip',
  'chipOff',
  'control',
  'credits',
  'h1Phone',
  'label',
  'link',
  'linkS',
  'mono',
  'monoL',
  'overline',
  'overlineTight',
  'small',
  'title',
];
const ACCOUNT = {
  email: 'researcher@example.com',
  footer: 'Last backup: today, 02:00',
  groups: [
    [
      {
        detail: 'JSON and GeoJSON',
        icon: 'export',
        id: 'export',
        label: 'Export',
      },
      { icon: 'document', id: 'sources', label: 'Sources' },
    ],
    [
      { disabled: true, icon: 'signOut', id: 'out', label: 'Sign out' },
      { icon: 'info', id: 'about', label: 'About' },
    ],
  ],
};

const PANEL = {
  footnote: 'Footnote',
  subtitle: 'Subtitle',
  title: 'Sources',
};

type Make = (
  state: (typeof FOCUS)[number] | undefined,
  disabled: boolean
) => Omit<State, 'label'>;

/** Default, the three states, then disabled. */
const grid = (name: string, make: Make): State[] => [
  { label: `${name} · default`, ...make(undefined, false) },
  ...FOCUS.map(state => ({
    label: `${name} · ${state}`,
    ...make(state, false),
  })),
  { label: `${name} · disabled`, ...make(undefined, true) },
];

/** A link has no disabled state: default, then the three states. */
const linkGrid = (
  name: string,
  make: (state: (typeof FOCUS)[number] | undefined) => Omit<State, 'label'>
): State[] =>
  [undefined, ...FOCUS].map(state => ({
    label: `${name} · ${state ?? 'default'}`,
    ...make(state),
  }));

const one = (
  label: string,
  props: State['props'],
  children?: State['children'],
  slots?: State['slots']
) => ({
  children,
  label,
  props,
  slots,
});

/** The width of the `Map` board's panel slot. A `Panel`, `LayerGroup` or `FilterFields` card box has it. */
const PANEL_BOX = 'var(--size-panel)';

/** The body of the centred dialog: 760px less 28px of padding on each side. The `SourcesList` card box has it. */
const SOURCES_BOX = '704px';

/** The body of the sheet on a 390px phone, less 16px of padding on each side. The `list` state of `SourcesList` has it. */
const SHEET_BOX = '358px';

/** The 300px open card of `Credits`, and 120px at its left for the caption of its case: the card opens over the caption's row. */
const CREDITS_BOX = '420px';

const FILTER_HANDLERS = [
  'onBranchChange',
  'onEventToggle',
  'onPersonChange',
  'onSurnamesChange',
];
const LAYER_HANDLERS = ['rows.onChange'];

/** The props of a `FilterFields` state: the empty state, with `props` set over it. */
const filterFields = (props: State['props']): State['props'] => ({
  branch: '',
  branches: FILTER_BRANCHES,
  events: [],
  eventTypes: FILTER_EVENT_TYPES,
  people: FILTER_PEOPLE,
  person: '',
  surnames: [],
  ...props,
});

const AVATAR = { control: 'Avatar', props: { initial: 'R' } };

const HEADER = {
  control: 'PageHeader',
  props: { backHref: '/people', backLabel: 'People' },
};

/** The heading and the line of text that a `ColumnLayout` state holds. */
const columnText = (title: string): Slot[] => [
  { children: title, control: 'Text', props: { as: 'h1', variant: 'h1' } },
  {
    children: 'Each change saves at once.',
    control: 'Text',
    props: { variant: 'small' },
  },
];

/** The one `NoticeCard` that a notice column holds: a notice column centres a single child. */
const columnNotice = (props: State['props'], text: string): Slot[] => [
  { children: text, control: 'NoticeCard', props },
];

/** What the `ColumnLayout` state of each `column` value holds, as the People screens fill it. */
const COLUMN_CONTENT: Record<Column, Slot[]> = {
  detail: columnText('Relationships'),
  form: columnText('Add a person'),
  list: columnText('People'),
  notice: columnNotice(
    {
      actions: [{ href: '/people', label: 'Go to People' }],
      icon: 'people',
      size: 'large',
      title: 'Person not found',
    },
    'No one in your Tree has this address. The person may have been deleted, or the link is wrong.'
  ),
  'phone-notice': columnNotice(
    {
      actions: [{ href: '/people', label: 'See all people' }],
      phone: true,
      title: 'Edit people on a computer',
    },
    'People are added and edited on a larger screen. On a phone you can look them up.'
  ),
};

const dateField = (props: State['props'] = {}) => ({
  // The first Map date, today, and a day between.
  day: MAP_DATE,
  max: TODAY,
  min: 0,
  precision: 'day',
  ...props,
});

/** A typed date that no calendar has. */
const IMPOSSIBLE_DATE = '1901-02-30';

const BAD_DATES = [
  ['wrong format', '14/06/1901'],
  ['before 1652', '1650'],
  ['after today', '2031'],
  ["doesn't exist", IMPOSSIBLE_DATE],
];

/** The `sheet` prop of a collapsed `DateDock` phone sheet. A preview gives it `onExpandedChange`. */
const PHONE_SHEET = { expanded: false };

const checkboxes = (name: string, make: (checked: boolean) => Make) =>
  [false, true].flatMap(checked =>
    grid(`${name} ${checked ? 'on' : 'off'}`, make(checked))
  );

/** One card per control, in the order of `CONTROLS`. */
export const CARDS: Card[] = [
  {
    design: ['Buttons', 'Primary button', 'Secondary button'],
    group: 'Actions',
    handlers: [],
    height: 520,
    name: 'Button',
    pad: 0,
    states: [
      ...grid('Button', (state, disabled) => ({
        children: 'Sign in',
        props: { disabled, state, variant: 'primary' },
      })),
      ...grid('Button secondary', (state, disabled) => ({
        children: 'Copy chain',
        props: { disabled, icon: 'copy', state },
      })),
      ...(['l', 's', 'xs'] as const).map(size => ({
        children: 'Copy chain',
        label: `Button · size ${size}`,
        props: { icon: 'copy', size },
      })),
      ...linkGrid('Button link', state => ({
        children: 'See all people',
        props: { href: '/people', state, variant: 'primary' },
      })),
      ...linkGrid('Button link secondary', state => ({
        children: 'Cancel',
        props: { href: '/people', state },
      })),
    ],
  },
  {
    design: [],
    group: 'Actions',
    handlers: [],
    height: 240,
    name: 'IconButton',
    pad: 0,
    states: [
      ...grid('IconButton', (state, disabled) => ({
        children: '+',
        props: { disabled, label: 'Zoom in', state },
      })),
      ...grid('IconButton raised', (state, disabled) => ({
        children: '+',
        props: { disabled, label: 'Layers', state, variant: 'raised' },
      })),
    ],
  },
  {
    design: ['Chips'],
    group: 'Actions',
    handlers: [],
    height: 220,
    name: 'Chip',
    pad: 0,
    states: [
      ...grid('Chip', (state, disabled) => ({
        children: 'Birth',
        props: { disabled, glyph: 'birth', on: true, state },
      })),
      ...grid('Chip off', (state, disabled) => ({
        children: 'Death',
        props: { disabled, glyph: 'death', on: false, state },
      })),
    ],
  },
  {
    design: [],
    group: 'Actions',
    handlers: ['onToggle'],
    height: 120,
    name: 'ChipGroup',
    pad: 0,
    states: [
      one('ChipGroup · some on, some off', {
        label: 'Event type',
        options: OPTIONS,
        selected: ['birth', 'marriage'],
      }),
    ],
  },
  {
    design: ['Segmented control'],
    group: 'Actions',
    handlers: [],
    height: 200,
    name: 'Segmented',
    pad: 0,
    radios: true,
    states: grid('Segmented', (state, disabled) => ({
      props: {
        disabled,
        label: 'View',
        name: 'view',
        options: SEGMENTS.map(option => ({ ...option, state })),
        value: 'map',
      },
    })),
  },
  {
    design: ['Tabs'],
    group: 'Actions',
    handlers: [],
    height: 200,
    name: 'Tabs',
    pad: 0,
    states: grid('Tabs', (state, disabled) => ({
      props: {
        disabled,
        label: 'Panels',
        selected: 'layers',
        tabs: TABS.map(tab => ({ ...tab, state })),
      },
    })),
  },
  {
    design: [],
    group: 'Actions',
    handlers: ['onClick'],
    height: 200,
    name: 'TextLink',
    pad: 0,
    states: [
      ...grid('TextLink', (state, disabled) => ({
        children: 'Sources',
        props: { disabled, href: '/sources', state },
      })),
      one('TextLink · small', { href: '/sources', size: 'small' }, 'Sources'),
      one('TextLink · button', { size: 'small' }, 'Go to 1901-02-28'),
      {
        // The `running` form lays the link in a line of text, not as a flex item. A box of 150px wraps it to two lines, as the licence column of the sources table does.
        ...one(
          'TextLink · wrapped',
          { href: '/sources', size: 'small' },
          'SIL Open Font Licence 1.1'
        ),
        form: { box: '150px', name: 'running' },
      },
    ],
  },
  {
    design: ['Arrow link'],
    group: 'Actions',
    handlers: [],
    height: 200,
    name: 'ArrowLink',
    pad: 0,
    states: [
      ...linkGrid('ArrowLink', state => ({
        children: 'Edit',
        props: { href: '/people/1', state },
      })),
      one('ArrowLink · label', {}, 'Edit'),
    ],
  },
  {
    design: [],
    group: 'Actions',
    handlers: [],
    height: 100,
    name: 'KeyHint',
    pad: 0,
    states: [
      one('KeyHint · key', {}, '/'),
      one('KeyHint · decorative', { decorative: true }, '/'),
    ],
  },
  {
    contain: true,
    design: ['Action bar'],
    group: 'Actions',
    handlers: [],
    height: 240,
    name: 'ActionBar',
    pad: 0,
    states: [
      one('ActionBar · save and cancel', {}, [
        {
          children: 'Save',
          control: 'Button',
          props: { form: 'person', type: 'submit', variant: 'primary' },
        },
        { children: 'Cancel', control: 'Button', props: { href: '/people' } },
      ]),
    ],
  },
  {
    design: [],
    group: 'Actions',
    handlers: [],
    height: 200,
    name: 'RemovableChip',
    pad: 0,
    states: grid('RemovableChip', (state, disabled) => ({
      props: { disabled, state, value: 'Birth' },
    })),
  },
  {
    design: ['Person row'],
    group: 'Actions',
    handlers: [],
    height: 340,
    name: 'PersonRow',
    pad: 0,
    states: [
      ...linkGrid('PersonRow', state => ({
        props: {
          born: 'c. 1835',
          bornReading: 'About 1835',
          died: '1901',
          diedReading: 'In 1901',
          givenNames: 'Susanna',
          href: '/people/1',
          maidenName: 'Fourie',
          state,
          surname: 'Botha',
        },
      })),
      one('PersonRow · relationships link', {
        born: '1832',
        bornReading: 'In 1832',
        died: '1899',
        diedReading: 'In 1899',
        givenNames: 'Hendrik Willem',
        href: '/people/1',
        relationshipsHref: '/people/1/relationships',
        surname: 'Botha',
      }),
      one('PersonRow · phone', {
        born: '1832',
        bornReading: 'In 1832',
        died: '1899',
        diedReading: 'In 1899',
        form: 'phone',
        givenNames: 'Hendrik Willem',
        href: '/people/1',
        surname: 'Botha',
      }),
    ],
    width: 992,
  },
  {
    design: ['Relationship row'],
    group: 'Actions',
    handlers: [],
    height: 220,
    name: 'RelationshipRow',
    pad: 0,
    states: [
      one('RelationshipRow · child', {
        born: '1871',
        bornReading: 'In 1871',
        died: '1948',
        diedReading: 'In 1948',
        givenNames: 'Anna Catharina',
        href: '/people/2/relationships/1',
        subtype: 'biological',
        surname: 'le Roux',
      }),
      one('RelationshipRow · spouse', {
        born: 'c. 1835',
        bornReading: 'About 1835',
        died: '',
        diedReading: '',
        divorced: '1890',
        divorcedReading: 'In 1890',
        givenNames: 'Susanna',
        href: '/people/2/relationships/3',
        married: 'c. 1875',
        marriedReading: 'About 1875',
        surname: 'Botha',
      }),
    ],
    width: 992,
  },
  {
    design: ['Picker row'],
    group: 'Actions',
    handlers: [],
    height: 440,
    name: 'PickerRow',
    pad: 0,
    states: linkGrid('PickerRow', state => ({
      props: {
        born: 'c. 1856',
        bornReading: 'About 1856',
        died: '1930',
        diedReading: 'In 1930',
        givenNames: 'Maria Magdalena',
        maidenName: 'Rossouw',
        matchedVariant: 'Dutoit',
        state,
        surname: 'du Toit',
      },
    })),
    width: 736,
  },
  {
    design: ['Text field'],
    group: 'Forms',
    handlers: [],
    height: 440,
    name: 'TextField',
    pad: 0,
    states: [
      ...grid('TextField', (state, disabled) => ({
        props: { disabled, helper: 'Helper text', label: 'Name', state },
      })),
      one('TextField · error', { error: 'Enter a name.', label: 'Name' }),
      one('TextField · warning', { label: 'Name', mark: 'warning' }),
      one('TextField · search', {
        label: 'Search',
        shortcut: '/',
        type: 'search',
      }),
      one('TextField · password', { label: 'Password', type: 'password' }),
    ],
  },
  {
    design: ['Long text field'],
    group: 'Forms',
    handlers: [],
    height: 760,
    name: 'TextAreaField',
    pad: 0,
    states: [
      one('TextAreaField · default', { helper: 'Helper text', label: 'Notes' }),
      one('TextAreaField · hover', {
        helper: 'Helper text',
        label: 'Notes',
        state: 'hover',
      }),
      one('TextAreaField · focus', {
        helper: 'Helper text',
        label: 'Notes',
        state: 'focus',
      }),
      one('TextAreaField · disabled', {
        disabled: true,
        helper: 'Helper text',
        label: 'Notes',
      }),
      one('TextAreaField · long content', {
        defaultValue: LONG_NOTES,
        helper: 'Helper text',
        label: 'Notes',
        maxLength: 10000,
      }),
    ],
  },
  {
    design: [],
    group: 'Forms',
    handlers: [],
    height: 140,
    name: 'Checkbox',
    pad: 0,
    states: checkboxes('Checkbox', checked => (state, disabled) => ({
      props: {
        'aria-label': 'Deceased',
        defaultChecked: checked,
        disabled,
        state,
      },
    })),
  },
  {
    design: [],
    group: 'Forms',
    handlers: [],
    height: 380,
    name: 'CheckboxField',
    pad: 0,
    states: [
      ...checkboxes('CheckboxField', checked => (state, disabled) => ({
        props: {
          defaultChecked: checked,
          description: 'Only people born before 1920.',
          disabled,
          label: 'Deceased',
          state,
        },
      })),
      one('CheckboxField · plain', { label: 'Keep me', plain: true }),
    ],
  },
  {
    design: [],
    group: 'Forms',
    handlers: ['onChange'],
    height: 1100,
    name: 'DateField',
    pad: 72,
    states: [
      one('DateField · default', dateField()),
      ...FOCUS.map(state => one(`DateField · ${state}`, dateField({ state }))),
      one(
        'DateField · typing',
        dateField({ defaultText: '1901-0', state: 'focus' })
      ),
      ...BAD_DATES.flatMap(([name, defaultText]) =>
        ['below', 'above'].map(placement =>
          one(
            `DateField · ${name} · ${placement}`,
            dateField({ defaultText, placement })
          )
        )
      ),
      one(
        'DateField · info',
        dateField({ notice: { text: 'Switched to month.', tone: 'info' } })
      ),
      one(
        'DateField · notice',
        dateField({ notice: { text: 'Moved to 1652.', tone: 'warning' } })
      ),
    ],
  },
  {
    design: ['Fuzzy date field'],
    group: 'Forms',
    handlers: [],
    height: 1040,
    name: 'FuzzyDateField',
    pad: 0,
    states: [
      one('FuzzyDateField · empty', {
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
      }),
      one('FuzzyDateField · typing', {
        defaultValue: 'BET 1850 AND 18',
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
        state: 'focus',
      }),
      one('FuzzyDateField · readable', {
        defaultValue: 'BET 1850 AND 1855',
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
      }),
      one('FuzzyDateField · focus', {
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
        state: 'focus',
      }),
      one('FuzzyDateField · error', {
        defaultValue: '31 FEB 1850',
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
      }),
      one('FuzzyDateField · disabled', {
        disabled: true,
        helper: FUZZY_DATE_HELPER,
        label: 'Born',
      }),
      ...(
        [
          ['exact', '14 MAR 1850'],
          ['about', 'ABT 1850'],
          ['before', 'BEF 1850'],
          ['after', 'AFT 1850'],
          ['period', 'FROM 1850 TO 1855'],
          ['estimated', 'EST 1850'],
          ['calculated', 'CAL 1850'],
          ['error, wrong format', '14/03/1850'],
          ['error, year out of range', 'ABT 850'],
          ['error, range in reverse', 'BET 1855 AND 1850'],
        ] as const
      ).map(([name, defaultValue]) =>
        one(`FuzzyDateField · ${name}`, {
          defaultValue,
          helper: FUZZY_DATE_HELPER,
          label: 'Born',
        })
      ),
    ],
  },
  {
    design: [],
    group: 'Forms',
    handlers: [],
    height: 280,
    name: 'SelectField',
    pad: 0,
    states: [
      ...grid('SelectField', (state, disabled) => ({
        props: { disabled, label: 'Polity', options: POLITIES, state },
      })),
      one('SelectField · hidden label', {
        hideLabel: true,
        label: 'Polity',
        options: POLITIES,
      }),
    ],
  },
  {
    design: [],
    group: 'Forms',
    handlers: [],
    height: 760,
    name: 'TokenField',
    pad: 0,
    states: [
      ...grid('TokenField', (state, disabled) => ({
        props: {
          defaultValues: ['Birth', 'Death'],
          disabled,
          helper: 'Press Enter to add.',
          label: 'Event types',
          placeholder: 'Add a type',
          state,
        },
      })),
      one('TokenField · empty', {
        label: 'Event types',
        placeholder: 'Add a type',
      }),
      one('TokenField · error', {
        defaultValues: ['Birth', 'Death'],
        error: 'Use at most 20 spellings.',
        helper: 'Press Enter to add.',
        label: 'Event types',
        placeholder: 'Add a type',
      }),
    ],
  },
  {
    design: [],
    group: 'Map',
    handlers: [],
    height: 360,
    name: 'SearchBar',
    pad: 0,
    states: [
      one('SearchBar · bar', { form: 'bar' }),
      one('SearchBar · bar with text', {
        defaultValue: 'Kimberley',
        form: 'bar',
      }),
      one('SearchBar · pill', { form: 'pill' }, undefined, {
        account: AVATAR,
      }),
      one(
        'SearchBar · pill with text',
        { defaultValue: 'Kimberley', form: 'pill' },
        undefined,
        { account: AVATAR }
      ),
    ],
  },
  {
    design: [],
    group: 'Map',
    handlers: ['onFit', 'onZoomIn', 'onZoomOut'],
    height: 240,
    name: 'ZoomControls',
    pad: 0,
    states: [
      ...linkGrid('ZoomControls', state => ({ props: { state } })),
      one('ZoomControls · most zoom', { atMax: true }),
      one('ZoomControls · least zoom', { atMin: true }),
    ],
  },
  {
    design: [],
    group: 'Map',
    handlers: [],
    height: 140,
    name: 'LayersButton',
    pad: 0,
    states: grid('LayersButton', (state, disabled) => ({
      props: { disabled, state },
    })),
  },
  {
    // The dock fills its slot and the sheet fills the phone, so each state fills the card.
    box: '100%',
    design: ['Date dock'],
    group: 'Map',
    handlers: ['onChange', 'onPlay', 'sheet.onExpandedChange'],
    height: 1720,
    name: 'DateDock',
    // Clears the callout of an invalid date, which opens above the dock and the sheet.
    pad: 40,
    radios: true,
    states: [
      one('DateDock · Map date', { day: MAP_DATE, lastDay: TODAY }),
      one('DateDock · with epochs', {
        day: MAP_DATE,
        epochs: EPOCHS,
        lastDay: TODAY,
      }),
      one('DateDock · with contested claims', {
        contestedCount: CONTESTED_COUNT,
        contestedYears: CONTESTED_YEARS,
        day: MAP_DATE,
        lastDay: TODAY,
      }),
      one('DateDock · phone sheet', {
        day: MAP_DATE,
        lastDay: TODAY,
        sheet: PHONE_SHEET,
      }),
      one('DateDock · invalid date', {
        day: MAP_DATE,
        defaultText: IMPOSSIBLE_DATE,
        lastDay: TODAY,
      }),
      one('DateDock · phone sheet · invalid date', {
        day: MAP_DATE,
        defaultText: IMPOSSIBLE_DATE,
        lastDay: TODAY,
        sheet: PHONE_SHEET,
      }),
    ],
  },
  {
    design: [],
    group: 'Map',
    handlers: [],
    height: 280,
    name: 'Legend',
    pad: 0,
    states: [one('Legend · default', {})],
  },
  {
    design: [],
    group: 'Map',
    handlers: [],
    height: 140,
    name: 'EventGlyph',
    pad: 0,
    states: EVENT_TYPES.map(event => one(`EventGlyph · ${event}`, { event })),
  },
  {
    box: PANEL_BOX,
    design: [],
    group: 'Map',
    handlers: ['onSelect'],
    height: 760,
    name: 'Panel',
    pad: 0,
    states: [
      one(
        'Panel · Layers tab',
        {
          bodyId: 'panel-layers',
          label: 'Layers and filters',
          selected: 'layers',
          tabs: panelTabs('panel-layers'),
        },
        LAYER_GROUPS.map(({ heading, rows }) => ({
          control: 'LayerGroup',
          handlers: LAYER_HANDLERS,
          props: { heading, rows },
        })),
        { end: { control: 'Legend', props: {} } }
      ),
      one(
        'Panel · Filters tab',
        {
          bodyId: 'panel-filters',
          gap: 20,
          label: 'Layers and filters',
          selected: 'filters',
          tabs: panelTabs('panel-filters'),
        },
        [
          {
            control: 'FilterFields',
            handlers: FILTER_HANDLERS,
            props: filterFields({
              events: FILTER_EVENT_TYPES.map(({ value }) => value),
              surnameHelper: SURNAME_HELPER,
              surnames: ['Rossouw'],
            }),
          },
        ],
        {
          end: {
            children: 'Clear filters',
            control: 'Button',
            props: {},
          },
        }
      ),
    ],
  },
  {
    box: PANEL_BOX,
    design: ['Layer rows'],
    group: 'Map',
    handlers: LAYER_HANDLERS,
    height: 200,
    name: 'LayerGroup',
    pad: 0,
    states: [
      one('LayerGroup · rows on and off', {
        heading: LAYER_GROUPS[0].heading,
        rows: LAYER_GROUPS[0].rows,
      }),
    ],
  },
  {
    box: PANEL_BOX,
    design: [],
    group: 'Map',
    handlers: FILTER_HANDLERS,
    height: 480,
    name: 'FilterFields',
    pad: 0,
    states: [
      one('FilterFields · empty', filterFields({})),
      one(
        'FilterFields · with values',
        filterFields({
          branch: 'ancestors',
          events: ['birth', 'marriage'],
          people: FILTER_PEOPLE_WITH_ONE,
          person: 'p1',
          surnameHelper: SURNAME_HELPER,
          surnames: ['Rossouw'],
        })
      ),
    ],
  },
  {
    box: SOURCES_BOX,
    design: ['Sources and attributions dialog'],
    group: 'Map',
    handlers: [],
    height: 3760,
    name: 'SourcesList',
    pad: 0,
    states: [
      one('SourcesList · table', { sources: sources.sources }),
      {
        ...one('SourcesList · list', { sources: sources.sources }),
        form: { box: SHEET_BOX, name: 'sheet' },
      },
    ],
    width: 760,
  },
  {
    // A case is a flex column, so the line sits at the right, as in the slot.
    box: CREDITS_BOX,
    design: ['Credits line', 'Credits card'],
    group: 'Map',
    handlers: ['onOpenAttributions'],
    height: 240,
    name: 'Credits',
    // The open card opens above its line: this clears it above its case.
    pad: 64,
    states: [
      one('Credits · one line', {
        collapsible: true,
        showPolities: true,
        sources: sources.sources,
      }),
      one('Credits · open', {
        collapsible: true,
        defaultOpen: true,
        showPolities: true,
        sources: sources.sources,
      }),
      one('Credits · full text', {
        showPolities: true,
        sources: sources.sources,
      }),
    ],
  },
  {
    design: ['Alert'],
    group: 'Feedback',
    handlers: [],
    height: 240,
    name: 'Alert',
    pad: 0,
    states: ['error', 'info', 'success', 'warning'].map(tone =>
      one(`Alert · ${tone}`, { title: 'Title', tone }, 'Something happened.')
    ),
  },
  {
    design: ['Toast'],
    group: 'Feedback',
    handlers: ['onDismiss'],
    height: 140,
    name: 'Toast',
    pad: 0,
    states: ['error', 'success'].map(tone =>
      one(`Toast · ${tone}`, { action: 'Undo', tone }, 'Done.')
    ),
  },
  {
    design: ['Banner'],
    group: 'Feedback',
    handlers: [],
    height: 140,
    name: 'Banner',
    pad: 0,
    states: [
      one(
        'Banner · offline',
        { action: 'Retry', icon: 'cloudOff' },
        'You are offline.'
      ),
    ],
  },
  {
    design: [],
    group: 'Feedback',
    handlers: [],
    height: 120,
    name: 'Callout',
    pad: 0,
    states: [one('Callout · error', { id: 'callout-error' }, 'Enter a date.')],
  },
  {
    design: ['Notice card'],
    group: 'Feedback',
    handlers: [],
    height: 680,
    name: 'NoticeCard',
    pad: 0,
    states: [
      one(
        'NoticeCard · one action',
        {
          actions: [{ label: 'Undo' }],
          icon: 'info',
          title: 'Layer hidden',
        },
        'The 1910 provinces are off.'
      ),
      one(
        'NoticeCard · two actions',
        {
          actions: [{ label: 'Retry' }, { label: 'Dismiss' }],
          icon: 'warning',
          title: 'Map not loaded',
        },
        'Check your connection.'
      ),
      one(
        'NoticeCard · link action',
        {
          actions: [{ href: '/people', label: 'See all people' }],
          icon: 'info',
          title: 'No match',
        },
        'Nobody has this name.'
      ),
      one(
        'NoticeCard · loading',
        { progress: 40, title: 'Loading boundaries' },
        '1910 of 1994.'
      ),
      one(
        'NoticeCard · large',
        { icon: 'info', size: 'large', title: 'No ancestors yet' },
        'Add a Person to see them on the map.'
      ),
      one(
        'NoticeCard · phone',
        {
          actions: [{ label: 'Undo' }],
          icon: 'info',
          phone: true,
          title: 'Layer hidden',
        },
        'The 1910 provinces are off.'
      ),
    ],
  },
  {
    design: [],
    group: 'Feedback',
    handlers: [],
    height: 100,
    name: 'ProgressBar',
    pad: 0,
    // A preview gives each caption the id `ks-case-<index>`, so each bar takes its name from its caption.
    states: [0, 40, 100].map((value, index) =>
      one(`ProgressBar · ${value}`, { labelledBy: `ks-case-${index}`, value })
    ),
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 220,
    name: 'Avatar',
    pad: 0,
    states: [
      ...grid('Avatar', (state, disabled) => ({
        props: { disabled, initial: 'R', state },
      })),
      one('Avatar · open', { expanded: true, initial: 'R' }),
    ],
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 160,
    name: 'Divider',
    pad: 0,
    states: [
      one('Divider · plain', {}),
      one('Divider · labelled', { label: 'or' }),
    ],
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 300,
    name: 'Icon',
    pad: 0,
    states: [
      ...ICONS.map(name => one(`Icon · ${name}`, { name })),
      ...[14, 16, 20, 24, 28].map(size =>
        one(`Icon · search · ${size}`, { name: 'search', size })
      ),
    ],
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 220,
    name: 'Surface',
    pad: 0,
    states: ['floating', 'modal', 'raised', 'sheet'].map(level =>
      one(`Surface · ${level}`, { level }, 'Content')
    ),
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 700,
    name: 'Text',
    pad: 0,
    states: [
      ...[
        ['display', 'h1'],
        ['h1', 'h1'],
        ['h2', 'h2'],
        ['h3', 'h3'],
      ].map(([variant, as]) =>
        one(`Text · ${variant}`, { as, variant }, 'Sample')
      ),
      ...OTHERS.map(variant => one(`Text · ${variant}`, { variant }, 'Sample')),
      ...['error', 'info', 'warning'].map(tone =>
        one(`Text · body · ${tone}`, { tone, variant: 'body' }, 'Sample')
      ),
    ],
  },
  {
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 200,
    name: 'Wordmark',
    pad: 0,
    states: [
      ...[32, 36, 44].map(size => one(`Wordmark · ${size}`, { size })),
      one('Wordmark · icon only', { iconOnly: true }),
    ],
  },
  {
    design: ['Page header'],
    group: 'Foundation',
    handlers: [],
    height: 260,
    name: 'PageHeader',
    pad: 0,
    states: ['Map', 'People'].map(name =>
      one(
        `PageHeader · ${name}`,
        { backHref: `/${name.toLowerCase()}`, backLabel: name },
        undefined,
        { avatar: AVATAR }
      )
    ),
  },
  {
    design: ['Back link'],
    group: 'Foundation',
    handlers: [],
    height: 260,
    name: 'BackLink',
    pad: 0,
    states: linkGrid('BackLink', state => ({
      props: { href: '/map', label: 'Map', state },
    })),
  },
  {
    design: ['Menu'],
    group: 'Overlays',
    handlers: ['onSelect'],
    height: 160,
    name: 'Menu',
    pad: 0,
    states: [one('Menu · closed', { ...ACCOUNT, initial: 'R' })],
  },
  {
    design: ['Menu'],
    group: 'Overlays',
    handlers: ['onSelect'],
    height: 420,
    name: 'MenuPanel',
    pad: 0,
    states: [
      one('MenuPanel · open', ACCOUNT),
      one('MenuPanel · hovered', { ...ACCOUNT, hovered: 'sources' }),
    ],
  },
  {
    design: ['Jurisdiction popup'],
    group: 'Overlays',
    handlers: ['onClose', 'onCopied'],
    height: 420,
    name: 'Popup',
    pad: 0,
    states: ['floating', 'sheet'].map(form =>
      one(`Popup · ${form}`, {
        chain: CHAIN,
        coordinates: '28.738° S · 24.764° E',
        form,
        pins: PINS,
        place: 'Kimberley',
        year: 1901,
      })
    ),
  },
  {
    design: ['Phone date sheet'],
    group: 'Overlays',
    handlers: ['onExpandedChange'],
    height: 480,
    name: 'BottomSheet',
    pad: 0,
    states: [false, true].map(expanded =>
      one(
        `BottomSheet · ${expanded ? 'expanded' : 'collapsed'}`,
        { expanded },
        'Date controls'
      )
    ),
  },
  {
    design: ['Dialog'],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 300,
    name: 'Modal',
    pad: 0,
    states: [
      one('Modal · open', { 'aria-label': 'Modal', open: true }, 'Content'),
    ],
  },
  {
    design: ['Dialog'],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 500,
    name: 'Dialog',
    pad: 0,
    states: [one('Dialog · centred', { ...PANEL, open: true }, 'Content')],
  },
  {
    design: ['Dialog'],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 560,
    name: 'DialogPanel',
    pad: 0,
    states: ['centred', 'sheet'].map(form =>
      one(
        `DialogPanel · ${form}`,
        { ...PANEL, form, titleId: `dialog-${form}` },
        'Content'
      )
    ),
  },
  {
    design: [],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 500,
    name: 'Sheet',
    pad: 0,
    states: [one('Sheet · open', { open: true, title: 'Boards' }, 'Content')],
  },
  {
    design: [],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 560,
    name: 'SheetPanel',
    pad: 0,
    states: [
      one(
        'SheetPanel · title',
        { title: 'Boards', titleId: 'sheet-title' },
        'Content'
      ),
      one(
        'SheetPanel · subtitle',
        { subtitle: 'Subtitle', title: 'Sources', titleId: 'sheet-subtitle' },
        'Content'
      ),
      one(
        'SheetPanel · tabs',
        {
          tabs: { label: 'Layers and filters', selected: 'layers', tabs: TABS },
          titleId: 'sheet-tabs',
        },
        'Content'
      ),
    ],
  },
  {
    contain: true,
    design: [],
    frame: 480,
    group: 'Layout',
    handlers: [],
    height: 3400,
    name: 'ColumnLayout',
    pad: 0,
    states: [
      ...COLUMNS.map(column =>
        one(`ColumnLayout · ${column}`, { column }, COLUMN_CONTENT[column], {
          header: HEADER,
        })
      ),
      one(
        'ColumnLayout · form with an action bar',
        { column: 'form' },
        columnText('Add a person'),
        {
          actions: {
            children: 'Save',
            control: 'Button',
            props: { variant: 'primary' },
          },
          header: HEADER,
        }
      ),
    ],
    width: 1440,
  },
  {
    contain: true,
    design: [],
    frame: 480,
    group: 'Layout',
    handlers: [],
    height: 560,
    name: 'SignInLayout',
    pad: 0,
    states: [
      one(
        'SignInLayout · hero and form',
        {},
        [
          {
            children: 'Sign in to see your family on the map.',
            control: 'Text',
            props: { variant: 'small' },
          },
        ],
        {
          hero: {
            children: 'Your family, where they were.',
            control: 'Text',
            props: { as: 'h1', variant: 'h1' },
          },
        }
      ),
    ],
    width: 1440,
  },
  {
    contain: true,
    design: [],
    frame: 480,
    group: 'Layout',
    handlers: [],
    height: 560,
    name: 'MapLayout',
    pad: 0,
    states: [
      one(
        'MapLayout · text in each slot',
        {},
        [
          {
            children: 'The map',
            control: 'Text',
            props: { variant: 'small' },
          },
        ],
        Object.fromEntries(
          SLOTS.map(slot => [
            slot,
            {
              children: slot,
              control: 'Text',
              props: { variant: 'small' },
            },
          ])
        )
      ),
    ],
    width: 1440,
  },
];
