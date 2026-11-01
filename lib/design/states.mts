/** What each shared control's design system card shows (Spec #450): its group, height, `DESIGN.md` bullets and states. */

import type { Card, State } from './types.ts';

import { toDay } from '../domain/boundaries/model.mts';

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

/** The 12 cards, in the order of `CONTROLS`. */
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
];
