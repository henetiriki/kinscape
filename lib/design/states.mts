/** What each shared control's design system card shows (Spec #450): its group, height, `DESIGN.md` bullets and states. */

import type { Card, State } from '#ks/lib/design/types.ts';

import { toDay } from '#ks/lib/domain/boundaries/model.mts';

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

// Synthetic, as on the design kit's Popup, Dialog and Sheet samples.
const CHAIN = [
  { level: 'District', name: 'Kimberley' },
  {
    detail: 'Was Griqualand West until 1880',
    level: 'Colony',
    name: 'Cape Colony',
  },
];
const PINS = [
  {
    date: '1901-03-14',
    event: 'marriage',
    id: 'marriage',
    people: 'J. Rossouw & M. du Toit',
    title: 'Marriage',
  },
];
const DIALOG_WORDS = {
  subtitle: 'Where the map data comes from',
  title: 'Sources and attributions',
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

const one = (label: string, props: State['props'], children?: string) => ({
  children,
  label,
  props,
});

const dateField = (props: State['props'] = {}) => ({
  // The first Map date, today, and a day between.
  day: toDay('1901-06-14'),
  max: toDay('2026-10-21'),
  min: 0,
  precision: 'day',
  ...props,
});

const BAD_DATES = [
  ['wrong format', '14/06/1901'],
  ['before 1652', '1650'],
  ['after today', '2031'],
  ["doesn't exist", '1901-02-30'],
];

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
    height: 220,
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
    ],
  },
  {
    design: [],
    group: 'Actions',
    handlers: [],
    height: 120,
    name: 'IconButton',
    pad: 0,
    states: grid('IconButton', (state, disabled) => ({
      children: '+',
      props: { disabled, label: 'Zoom in', state },
    })),
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
    design: [],
    group: 'Foundation',
    handlers: [],
    height: 220,
    name: 'Avatar',
    pad: 0,
    states: [
      ...grid('Avatar', (state, disabled) => ({
        props: { disabled, initial: 'L', state },
      })),
      one('Avatar · open', { expanded: true, initial: 'L' }),
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
    design: ['Menu'],
    group: 'Overlays',
    handlers: ['onSelect'],
    height: 160,
    name: 'Menu',
    pad: 0,
    states: [one('Menu · closed', { ...ACCOUNT, initial: 'L' })],
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
    height: 520,
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
    height: 320,
    name: 'BottomSheet',
    pad: 0,
    states: [false, true].map(expanded =>
      one(
        `BottomSheet · ${expanded ? 'expanded' : 'collapsed'}`,
        { expanded },
        'Map date'
      )
    ),
  },
  {
    design: [],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 320,
    name: 'Modal',
    pad: 0,
    states: [
      one('Modal · open', { 'aria-label': 'Example', open: true }, 'Content'),
    ],
  },
  {
    design: ['Dialog'],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 520,
    name: 'Dialog',
    pad: 0,
    states: [
      one(
        'Dialog · open',
        { form: 'centred', open: true, ...DIALOG_WORDS },
        'Content'
      ),
    ],
  },
  {
    design: ['Dialog'],
    group: 'Overlays',
    handlers: [],
    height: 880,
    name: 'DialogPanel',
    pad: 0,
    states: ['centred', 'sheet'].map(form =>
      one(
        `DialogPanel · ${form}`,
        { form, titleId: `dialog-${form}`, ...DIALOG_WORDS },
        'Content'
      )
    ),
  },
  {
    design: [],
    group: 'Overlays',
    handlers: ['onClose'],
    height: 420,
    name: 'Sheet',
    pad: 0,
    states: [one('Sheet · open', { open: true, title: 'Boards' }, 'Content')],
  },
  {
    design: [],
    group: 'Overlays',
    handlers: [],
    height: 880,
    name: 'SheetPanel',
    pad: 0,
    states: [
      one(
        'SheetPanel · title',
        { title: 'Boards', titleId: 'head-title' },
        'Content'
      ),
      one(
        'SheetPanel · title and subtitle',
        { titleId: 'head-subtitle', ...DIALOG_WORDS },
        'Content'
      ),
      one(
        'SheetPanel · tabs',
        {
          tabs: { label: 'Layers and filters', selected: 'layers', tabs: TABS },
          titleId: 'head-tabs',
        },
        'Content'
      ),
    ],
  },
];
