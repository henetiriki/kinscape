import type { ReactElement } from 'react';

import {
  // eslint-disable-next-line testing-library/no-manual-cleanup -- the test unmounts before the last check, so a React log on unmount fails the test
  cleanup,
} from '@testing-library/react';
import * as React from 'react';
import { isValidElement } from 'react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { ActionBar } from '@ks/app/components/actions/ActionBar';
import { ArrowLink } from '@ks/app/components/actions/ArrowLink';
import { Button } from '@ks/app/components/actions/Button';
import { Chip, RemovableChip } from '@ks/app/components/actions/Chip';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { KeyHint } from '@ks/app/components/actions/KeyHint';
import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { PickerRow } from '@ks/app/components/actions/PickerRow';
import { RelationshipRow } from '@ks/app/components/actions/RelationshipRow';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { Tabs } from '@ks/app/components/actions/Tabs';
import { TextLink } from '@ks/app/components/actions/TextLink';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Banner } from '@ks/app/components/feedback/Banner';
import { Callout } from '@ks/app/components/feedback/Callout';
import { LoadingBar } from '@ks/app/components/feedback/LoadingBar';
import { LoadingField } from '@ks/app/components/feedback/LoadingField';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { ProgressBar } from '@ks/app/components/feedback/ProgressBar';
import { Toast } from '@ks/app/components/feedback/Toast';
import { Checkbox } from '@ks/app/components/forms/Checkbox';
import { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TextAreaField } from '@ks/app/components/forms/TextAreaField';
import { TextField } from '@ks/app/components/forms/TextField';
import { TokenField } from '@ks/app/components/forms/TokenField';
import { Avatar } from '@ks/app/components/foundation/Avatar';
import { Divider } from '@ks/app/components/foundation/Divider';
import { Icon, PATHS } from '@ks/app/components/foundation/Icon';
import { BackLink, PageHeader } from '@ks/app/components/foundation/PageHeader';
import { Surface } from '@ks/app/components/foundation/Surface';
import { DEFAULT_TAG, Text } from '@ks/app/components/foundation/Text';
import { Wordmark } from '@ks/app/components/foundation/Wordmark';
import { ColumnLayout } from '@ks/app/components/layout/ColumnLayout';
import { MapLayout } from '@ks/app/components/layout/MapLayout';
import { SignInLayout } from '@ks/app/components/layout/SignInLayout';
import { BottomSheet } from '@ks/app/components/overlays/BottomSheet';
import { ClickPopup } from '@ks/app/components/overlays/ClickPopup';
import { Dialog, DialogPanel } from '@ks/app/components/overlays/Dialog';
import { Menu, MenuPanel } from '@ks/app/components/overlays/Menu';
import { Modal } from '@ks/app/components/overlays/Modal';
import { PinPopup, PlacedPinPopup } from '@ks/app/components/overlays/PinPopup';
import { PlacedPopup, Popup } from '@ks/app/components/overlays/Popup';
import { Sheet, SheetPanel } from '@ks/app/components/overlays/Sheet';
import sourceData from '@ks/data/sources.json';
import { AddPinButton } from '@ks/features/map/components/AddPinButton';
import { CountMarker } from '@ks/features/map/components/CountMarker';
import { Credits } from '@ks/features/map/components/Credits';
import { DateDock } from '@ks/features/map/components/DateDock';
import { DateField } from '@ks/features/map/components/DateField';
import { FilterFields } from '@ks/features/map/components/FilterFields';
import { LayerGroup } from '@ks/features/map/components/LayerGroup';
import { LayersButton } from '@ks/features/map/components/LayersButton';
import { Legend } from '@ks/features/map/components/Legend';
import { Panel } from '@ks/features/map/components/Panel';
import { PinFan } from '@ks/features/map/components/PinFan';
import { SearchBar } from '@ks/features/map/components/SearchBar';
import { SourcesList } from '@ks/features/map/components/SourcesDialog';
import { ZoomControls } from '@ks/features/map/components/ZoomControls';
import { FuzzyDateField } from '@ks/features/people/components/FuzzyDateField';
import {
  PersonField,
  PersonFieldList,
} from '@ks/features/people/components/PersonField';
import {
  CHAIN,
  CLICK_POINT,
  CONTESTED_COUNT,
  CONTESTED_YEARS,
  EPOCHS,
  FAN_PINS,
  FILTER_BRANCHES,
  FILTER_EVENT_TYPES,
  FILTER_PEOPLE,
  FILTER_PEOPLE_WITH_ONE,
  LAYER_GROUPS,
  LONG_NOTES,
  MAP_DATE,
  panelTabs,
  personRows,
  PICK_PEOPLE,
  PINS,
  PLACED_X,
  PLACED_Y,
  SURNAME_HELPER,
  TODAY,
  TWELVE_PINS,
} from '@ks/lib/design/samples.mts';
import { MIN_DAY } from '@ks/lib/domain/map/map-date.mts';
import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';
import { EventGlyph } from '@ks/lib/ui/EventGlyph';
import { DRAWN_LEGEND_ROWS } from '@ks/lib/ui/legend.mts';

// The shared controls (DS.5) must work in the React 18 the design system targets as well as the app's 19.

const STATES = ['active', 'focus', 'hover'] as const;

export const TABS = [
  { label: 'Layers', value: 'layers' },
  { count: 1, label: 'Filters', value: 'filters' },
  { label: 'More', value: 'more' },
];
export const SEGMENTS = [
  { label: 'Map', value: 'map' },
  { label: 'List', value: 'list' },
];
export const OPTIONS = [
  { glyph: 'birth', label: 'Birth', value: 'birth' },
  { glyph: 'death', label: 'Death', value: 'death' },
  { glyph: 'marriage', label: 'Marriage', value: 'marriage' },
] as const;
export const POLITIES = [
  { label: 'Cape', value: 'cape' },
  { label: 'Natal', value: 'natal' },
  { label: 'Transvaal', value: 'transvaal' },
];

const states = (
  name: string,
  make: (
    state: (typeof STATES)[number] | undefined,
    disabled: boolean
  ) => ReactElement
): [string, ReactElement][] => [
  [`${name} · default`, make(undefined, false)],
  ...STATES.map((state): [string, ReactElement] => [
    `${name} · ${state}`,
    make(state, false),
  ]),
  [`${name} · disabled`, make(undefined, true)],
];

/** A link has no disabled state: default, then the three states. */
const links = (
  name: string,
  make: (state: (typeof STATES)[number] | undefined) => ReactElement
): [string, ReactElement][] =>
  [undefined, ...STATES].map(state => [
    `${name} · ${state ?? 'default'}`,
    make(state),
  ]);

const GROUPS = [
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
] as const;

export const ACCOUNT = {
  email: 'researcher@example.com',
  footer: 'Last backup: today, 02:00',
  groups: GROUPS.map(group => [...group]),
};
const HEADINGS = [
  ['display', 'h1'],
  ['h1', 'h1'],
  ['h2', 'h2'],
  ['h3', 'h3'],
] as const;
const OTHERS = Object.keys(DEFAULT_TAG) as (keyof typeof DEFAULT_TAG)[];

export const COMPONENTS = {
  ActionBar,
  AddPinButton,
  Alert,
  ArrowLink,
  Avatar,
  BackLink,
  Banner,
  BottomSheet,
  Button,
  Callout,
  Checkbox,
  CheckboxField,
  Chip,
  ChipGroup,
  ClickPopup,
  ColumnLayout,
  CountMarker,
  Credits,
  DateDock,
  DateField,
  Dialog,
  DialogPanel,
  Divider,
  EventGlyph,
  FilterFields,
  FuzzyDateField,
  Icon,
  IconButton,
  KeyHint,
  LayerGroup,
  LayersButton,
  Legend,
  LoadingBar,
  LoadingField,
  MapLayout,
  Menu,
  MenuPanel,
  Modal,
  NoticeCard,
  PageHeader,
  Panel,
  PersonField,
  PersonFieldList,
  PersonRow,
  PickerRow,
  PinFan,
  PinPopup,
  PlacedPinPopup,
  PlacedPopup,
  Popup,
  ProgressBar,
  RelationshipRow,
  RemovableChip,
  SearchBar,
  Segmented,
  SelectField,
  Sheet,
  SheetPanel,
  SignInLayout,
  SourcesList,
  Surface,
  Tabs,
  Text,
  TextAreaField,
  TextField,
  TextLink,
  Toast,
  TokenField,
  Wordmark,
  ZoomControls,
};

/** The `COMPONENTS` name of an element's type. */
const controlName = (type: unknown): string | undefined =>
  Object.entries(COMPONENTS).find(([, each]) => each === type)?.[0];

/** The keys of the functions in a plain object. An element or a primitive has none. */
const functionKeys = (value: unknown): string[] =>
  value !== null && typeof value === 'object' && !isValidElement(value)
    ? Object.entries(value)
        .filter(([, each]) => typeof each === 'function')
        .map(([key]) => key)
    : [];

/** The function props of a control, as `Card.handlers` names them: `onClick`, or `rows.onChange` for a function in each item of a list. */
const handlerNames = (props: object): string[] => {
  const inLists = Object.entries(props).flatMap(([key, value]) =>
    Array.isArray(value)
      ? value.flatMap(item => functionKeys(item).map(name => `${key}.${name}`))
      : []
  );

  return [...new Set([...functionKeys(props), ...inLists])].toSorted();
};

/** A control in a prop or in the children, as a card lists it. */
const toSlot = (element: ReactElement<{ children?: string }>) => {
  const { children, ...props } = element.props;
  const handlers = handlerNames(props);

  return {
    children,
    control: controlName(element.type)!,
    handlers: handlers.length > 0 ? handlers : undefined,
    props: slotted(props),
  };
};

/** The same element tree with the controls and the React of the bundle's page: a control with hooks needs the page's copy. */
export const rebuild = (
  value: unknown,
  pageReact: typeof React,
  controls: Record<string, unknown>,
  key?: number
): unknown => {
  if (Array.isArray(value)) {
    return value.map((each, at) => rebuild(each, pageReact, controls, at));
  }

  const name = isValidElement(value) ? controlName(value.type) : undefined;

  if (name === undefined) return value;

  const { children, ...props } = (value as ReactElement).props as Record<
    string,
    unknown
  >;
  const made = Object.fromEntries(
    Object.entries(props).map(([prop, each]) => [
      prop,
      rebuild(each, pageReact, controls),
    ])
  );

  return pageReact.createElement(
    controls[name] as never,
    (key === undefined ? made : { ...made, key }) as never,
    rebuild(children, pageReact, controls) as never
  );
};

export const slotted = (value: unknown): unknown =>
  isValidElement(value)
    ? toSlot(value as ReactElement<{ children?: string }>)
    : Array.isArray(value)
      ? value.map(slotted)
      : value !== null && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, each]) => typeof each !== 'function')
              .map(([key, each]) => [key, slotted(each)])
          )
        : value;

const noop = () => {};

export const dateField = (
  props: Partial<Parameters<typeof DateField>[0]> = {}
) => (
  <DateField
    day={MAP_DATE}
    max={TODAY}
    min={MIN_DAY}
    onChange={noop}
    precision='day'
    {...props}
  />
);

const fuzzyDateField = (
  props: Partial<Parameters<typeof FuzzyDateField>[0]> = {}
) => (
  <FuzzyDateField
    helper='For example 1850, ABT 1850 or BET 1850 AND 1855.'
    label='Born'
    {...props}
  />
);

export const CASES: [string, ReactElement][] = [
  ...states('Button', (state, disabled) => (
    <Button disabled={disabled} state={state} variant='primary'>
      Sign in
    </Button>
  )),
  ...states('Button secondary', (state, disabled) => (
    <Button disabled={disabled} icon='copy' state={state}>
      Copy chain
    </Button>
  )),
  ...(['l', 's', 'xs'] as const).map(
    size =>
      [
        `Button · size ${size}`,
        <Button icon='copy' key={size} size={size}>
          Copy chain
        </Button>,
      ] as [string, ReactElement]
  ),
  [
    'Button · round',
    <Button icon='play' key='round' round size='l' variant='primary'>
      Play
    </Button>,
  ],
  ...links('Button link', state => (
    <Button href='/people' state={state} variant='primary'>
      See all people
    </Button>
  )),
  ...links('Button link secondary', state => (
    <Button href='/people' state={state}>
      Cancel
    </Button>
  )),
  ...states('IconButton', (state, disabled) => (
    <IconButton disabled={disabled} label='Zoom in' state={state}>
      +
    </IconButton>
  )),
  ...states('IconButton raised', (state, disabled) => (
    <IconButton
      disabled={disabled}
      label='Layers'
      state={state}
      variant='raised'>
      +
    </IconButton>
  )),
  ...states('Chip', (state, disabled) => (
    <Chip disabled={disabled} glyph='birth' on state={state}>
      Birth
    </Chip>
  )),
  ...states('Chip off', (state, disabled) => (
    <Chip disabled={disabled} glyph='death' on={false} state={state}>
      Death
    </Chip>
  )),
  [
    'ChipGroup · some on, some off',
    <ChipGroup
      key='chips'
      label='Event type'
      onToggle={noop}
      options={[...OPTIONS]}
      selected={['birth', 'marriage']}
    />,
  ],
  ...states('Segmented', (state, disabled) => (
    <Segmented
      disabled={disabled}
      label='View'
      name='view'
      options={SEGMENTS.map(option => ({ ...option, state }))}
      value='map'
    />
  )),
  ...states('Tabs', (state, disabled) => (
    <Tabs
      disabled={disabled}
      label='Panels'
      selected='layers'
      tabs={TABS.map(tab => ({ ...tab, state }))}
    />
  )),
  ...states('TextLink', (state, disabled) => (
    <TextLink disabled={disabled} href='/sources' state={state}>
      Sources
    </TextLink>
  )),
  [
    'TextLink · small',
    <TextLink href='/sources' key='small' size='small'>
      Sources
    </TextLink>,
  ],
  [
    'TextLink · button',
    <TextLink key='button' onClick={noop} size='small'>
      Go to 1901-02-28
    </TextLink>,
  ],
  [
    'TextLink · wrapped',
    <TextLink href='/sources' key='wrapped' size='small'>
      SIL Open Font Licence 1.1
    </TextLink>,
  ],
  ...links('ArrowLink', state => (
    <ArrowLink href='/people/1' state={state}>
      Edit
    </ArrowLink>
  )),
  ['ArrowLink · label', <ArrowLink key='label'>Edit</ArrowLink>],
  [
    'ActionBar · save and cancel',
    <ActionBar key='bar'>
      <Button form='person' type='submit' variant='primary'>
        Save
      </Button>
      <Button href='/people'>Cancel</Button>
    </ActionBar>,
  ],
  ['KeyHint · key', <KeyHint key='key'>/</KeyHint>],
  [
    'KeyHint · decorative',
    <KeyHint decorative key='decorative'>
      /
    </KeyHint>,
  ],
  ...states('RemovableChip', (state, disabled) => (
    <RemovableChip disabled={disabled} state={state} value='Birth' />
  )),
  ...links('PersonRow', state => (
    <PersonRow
      born='c. 1835'
      bornReading='About 1835'
      died='1901'
      diedReading='In 1901'
      givenNames='Susanna'
      href='/people/1'
      maidenName='Fourie'
      state={state}
      surname='Botha'
    />
  )),
  [
    'PersonRow · relationships link',
    <PersonRow
      born='1832'
      bornReading='In 1832'
      died='1899'
      diedReading='In 1899'
      givenNames='Hendrik Willem'
      href='/people/1'
      key='relationships'
      relationshipsHref='/people/1/relationships'
      surname='Botha'
    />,
  ],
  [
    'PersonRow · phone',
    <PersonRow
      born='1832'
      bornReading='In 1832'
      died='1899'
      diedReading='In 1899'
      form='phone'
      givenNames='Hendrik Willem'
      href='/people/1'
      key='phone'
      surname='Botha'
    />,
  ],
  [
    'RelationshipRow · child',
    <RelationshipRow
      born='1871'
      bornReading='In 1871'
      died='1948'
      diedReading='In 1948'
      givenNames='Anna Catharina'
      href='/people/2/relationships/1'
      key='child'
      subtype='biological'
      surname='le Roux'
    />,
  ],
  [
    'RelationshipRow · spouse',
    <RelationshipRow
      born='c. 1835'
      bornReading='About 1835'
      died=''
      diedReading=''
      divorced='1890'
      divorcedReading='In 1890'
      givenNames='Susanna'
      href='/people/2/relationships/3'
      key='spouse'
      married='c. 1875'
      marriedReading='About 1875'
      surname='Botha'
    />,
  ],
  ...links('PickerRow', state => (
    <PickerRow
      born='c. 1856'
      bornReading='About 1856'
      died='1930'
      diedReading='In 1930'
      givenNames='Maria Magdalena'
      maidenName='Rossouw'
      matchedVariant='Dutoit'
      state={state}
      surname='du Toit'
    />
  )),
  ...states('TextField', (state, disabled) => (
    <TextField
      disabled={disabled}
      helper='Helper text'
      label='Name'
      state={state}
    />
  )),
  [
    'TextField · error',
    <TextField error='Enter a name.' key='e' label='Name' />,
  ],
  ['TextField · warning', <TextField key='w' label='Name' mark='warning' />],
  [
    'TextField · search',
    <TextField key='s' label='Search' shortcut='/' type='search' />,
  ],
  [
    'TextField · password',
    <TextField key='p' label='Password' type='password' />,
  ],
  ['TextField · size l', <TextField key='l' label='Name' size='l' />],
  ...(
    [
      ['default', {}],
      ['hover', { state: 'hover' }],
      ['focus', { state: 'focus' }],
      ['disabled', { disabled: true }],
      ['error', { error: 'Add a note.' }],
      ['long content', { defaultValue: LONG_NOTES, maxLength: 10000 }],
    ] as const
  ).map(([name, props]): [string, ReactElement] => [
    `TextAreaField · ${name}`,
    <TextAreaField helper='Helper text' key={name} label='Notes' {...props} />,
  ]),
  ...[false, true].flatMap(checked =>
    states(`Checkbox ${checked ? 'on' : 'off'}`, (state, disabled) => (
      <Checkbox
        aria-label='Deceased'
        defaultChecked={checked}
        disabled={disabled}
        state={state}
      />
    ))
  ),
  ...[false, true].flatMap(checked =>
    states(`CheckboxField ${checked ? 'on' : 'off'}`, (state, disabled) => (
      <CheckboxField
        defaultChecked={checked}
        description='Only people born before 1920.'
        disabled={disabled}
        label='Deceased'
        state={state}
      />
    ))
  ),
  ['CheckboxField · size m', <CheckboxField key='m' label='Pins' size='m' />],
  ['CheckboxField · plain', <CheckboxField key='n' label='Keep me' plain />],
  ['DateField · default', dateField()],
  ...STATES.map((state): [string, ReactElement] => [
    `DateField · ${state}`,
    dateField({ state }),
  ]),
  ['DateField · typing', dateField({ defaultText: '1901-0', state: 'focus' })],
  ...(
    [
      ['wrong format', '14/06/1901'],
      ['before 1652', '1650'],
      ['after today', '2031'],
      ["doesn't exist", '1901-02-30'],
    ] as const
  ).flatMap(([name, defaultText]) =>
    (['below', 'above'] as const).map((placement): [string, ReactElement] => [
      `DateField · ${name} · ${placement}`,
      dateField({ defaultText, placement }),
    ])
  ),
  [
    'DateField · info',
    dateField({ notice: { text: 'Switched to month.', tone: 'info' } }),
  ],
  [
    'DateField · notice',
    dateField({ notice: { text: 'Moved to 1652.', tone: 'warning' } }),
  ],
  ['FuzzyDateField · empty', fuzzyDateField()],
  [
    'FuzzyDateField · typing',
    fuzzyDateField({ defaultValue: 'BET 1850 AND 18', state: 'focus' }),
  ],
  [
    'FuzzyDateField · readable',
    fuzzyDateField({ defaultValue: 'BET 1850 AND 1855' }),
  ],
  ['FuzzyDateField · focus', fuzzyDateField({ state: 'focus' })],
  ['FuzzyDateField · error', fuzzyDateField({ defaultValue: '31 FEB 1850' })],
  ['FuzzyDateField · required', fuzzyDateField({ error: 'Enter a date.' })],
  ['FuzzyDateField · disabled', fuzzyDateField({ disabled: true })],
  ['FuzzyDateField · exact', fuzzyDateField({ defaultValue: '14 MAR 1850' })],
  ['FuzzyDateField · about', fuzzyDateField({ defaultValue: 'ABT 1850' })],
  ['FuzzyDateField · before', fuzzyDateField({ defaultValue: 'BEF 1850' })],
  ['FuzzyDateField · after', fuzzyDateField({ defaultValue: 'AFT 1850' })],
  [
    'FuzzyDateField · period',
    fuzzyDateField({ defaultValue: 'FROM 1850 TO 1855' }),
  ],
  ['FuzzyDateField · estimated', fuzzyDateField({ defaultValue: 'EST 1850' })],
  ['FuzzyDateField · calculated', fuzzyDateField({ defaultValue: 'CAL 1850' })],
  [
    'FuzzyDateField · error, wrong format',
    fuzzyDateField({ defaultValue: '14/03/1850' }),
  ],
  [
    'FuzzyDateField · error, year out of range',
    fuzzyDateField({ defaultValue: 'ABT 850' }),
  ],
  [
    'FuzzyDateField · error, range in reverse',
    fuzzyDateField({ defaultValue: 'BET 1855 AND 1850' }),
  ],
  [
    'PersonField · empty',
    <PersonField key='e' onChange={noop} people={PICK_PEOPLE} />,
  ],
  [
    'PersonField · focus',
    <PersonField key='f' onChange={noop} people={PICK_PEOPLE} state='focus' />,
  ],
  [
    'PersonField · picked',
    <PersonField
      defaultPerson={PICK_PEOPLE[0]}
      key='p'
      onChange={noop}
      people={PICK_PEOPLE}
    />,
  ],
  [
    'PersonField · error',
    <PersonField
      error='Choose a person.'
      key='r'
      onChange={noop}
      people={PICK_PEOPLE}
    />,
  ],
  [
    'PersonFieldList · three rows',
    <PersonFieldList
      id='three'
      key='three'
      onPick={noop}
      query='Exa'
      rows={personRows('Exa', 3)}
    />,
  ],
  [
    'PersonFieldList · active row',
    <PersonFieldList
      activeId='active-p2'
      id='active'
      key='active'
      onPick={noop}
      query='Exa'
      rows={personRows('Exa', 3)}
    />,
  ],
  [
    'PersonFieldList · four rows, scrolls',
    <PersonFieldList
      id='four'
      key='four'
      onPick={noop}
      query='Exa'
      rows={personRows('Exa')}
    />,
  ],
  [
    'PersonFieldList · spelling variant',
    <PersonFieldList
      id='variant'
      key='variant'
      onPick={noop}
      query='Exemple'
      rows={personRows('Exemple')}
    />,
  ],
  [
    'PersonFieldList · no match',
    <PersonFieldList
      id='none'
      key='none'
      onPick={noop}
      query='Zzz'
      rows={[]}
    />,
  ],
  ...states('SelectField', (state, disabled) => (
    <SelectField
      disabled={disabled}
      label='Polity'
      options={POLITIES}
      state={state}
    />
  )),
  [
    'SelectField · error',
    <SelectField
      error='Choose a polity.'
      key='error'
      label='Polity'
      options={POLITIES}
    />,
  ],
  [
    'SelectField · hidden label',
    <SelectField hideLabel key='hidden' label='Polity' options={POLITIES} />,
  ],
  ...states('TokenField', (state, disabled) => (
    <TokenField
      defaultValues={['Birth', 'Death']}
      disabled={disabled}
      helper='Press Enter to add.'
      label='Event types'
      placeholder='Add a type'
      state={state}
    />
  )),
  [
    'TokenField · empty',
    <TokenField key='empty' label='Event types' placeholder='Add a type' />,
  ],
  [
    'TokenField · error',
    <TokenField
      defaultValues={['Birth', 'Death']}
      error='Use at most 20 spellings.'
      helper='Press Enter to add.'
      key='error'
      label='Event types'
      placeholder='Add a type'
    />,
  ],
  ['SearchBar · bar', <SearchBar form='bar' key='bar' />],
  [
    'SearchBar · bar with text',
    <SearchBar defaultValue='Kimberley' form='bar' key='bar-text' />,
  ],
  [
    'SearchBar · pill',
    <SearchBar account={<Avatar initial='R' />} form='pill' key='pill' />,
  ],
  [
    'SearchBar · pill with text',
    <SearchBar
      account={<Avatar initial='R' />}
      defaultValue='Kimberley'
      form='pill'
      key='pill-text'
    />,
  ],
  ...links('ZoomControls', state => (
    <ZoomControls
      key={state}
      onFit={noop}
      onZoomIn={noop}
      onZoomOut={noop}
      state={state}
    />
  )),
  [
    'ZoomControls · most zoom',
    <ZoomControls
      atMax
      key='most'
      onFit={noop}
      onZoomIn={noop}
      onZoomOut={noop}
    />,
  ],
  [
    'ZoomControls · least zoom',
    <ZoomControls
      atMin
      key='least'
      onFit={noop}
      onZoomIn={noop}
      onZoomOut={noop}
    />,
  ],
  ...states('LayersButton', (state, disabled) => (
    <LayersButton disabled={disabled} state={state} />
  )),
  ...links('AddPinButton', state => <AddPinButton state={state} />),
  [
    'DateDock · Map date',
    <DateDock
      day={MAP_DATE}
      key='plain'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
    />,
  ],
  [
    'DateDock · with epochs',
    <DateDock
      day={MAP_DATE}
      epochs={EPOCHS}
      key='epochs'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
    />,
  ],
  [
    'DateDock · with contested claims',
    <DateDock
      contestedCount={CONTESTED_COUNT}
      contestedYears={CONTESTED_YEARS}
      day={MAP_DATE}
      key='contested'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
    />,
  ],
  [
    'DateDock · phone sheet',
    <DateDock
      day={MAP_DATE}
      key='sheet'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
      sheet={{ expanded: false, onExpandedChange: noop }}
    />,
  ],
  [
    'DateDock · invalid date',
    <DateDock
      day={MAP_DATE}
      defaultText='1901-02-30'
      key='invalid'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
    />,
  ],
  [
    'DateDock · phone sheet · invalid date',
    <DateDock
      day={MAP_DATE}
      defaultText='1901-02-30'
      key='sheet-invalid'
      lastDay={TODAY}
      onChange={noop}
      onPlay={noop}
      sheet={{ expanded: false, onExpandedChange: noop }}
    />,
  ],
  ...([undefined, 'active', 'focus', 'hover'] as const).map(
    (state): [string, ReactElement] => [
      `CountMarker · ${state ?? 'default'}`,
      <CountMarker count={3} key={state ?? 'default'} state={state} />,
    ]
  ),
  ['CountMarker · selected', <CountMarker count={3} key='selected' selected />],
  ['CountMarker · 99 Pins', <CountMarker count={99} key='99' />],
  [
    'PinFan · three Pins, one under hover',
    <PinFan key='three' looks={{ birth: 'hover' }} pins={FAN_PINS}>
      {[<CountMarker count={3} key='marker' />]}
    </PinFan>,
  ],
  [
    'PinFan · twelve Pins',
    <PinFan key='twelve' pins={TWELVE_PINS}>
      {[<CountMarker count={12} key='marker' />]}
    </PinFan>,
  ],
  ['Legend · default', <Legend key='legend' />],
  ['Legend · drawn marks', <Legend key='drawn' rows={DRAWN_LEGEND_ROWS} />],
  ...EVENT_TYPES.map((event): [string, ReactElement] => [
    `EventGlyph · ${event}`,
    <EventGlyph event={event} key={event} />,
  ]),
  [
    'Panel · Layers tab',
    <Panel
      bodyId='panel-layers'
      end={<Legend />}
      gap='m'
      key='layers'
      label='Layers and filters'
      onSelect={noop}
      selected='layers'
      tabs={panelTabs('panel-layers')}>
      {LAYER_GROUPS.map(({ heading, rows }) => (
        <LayerGroup
          heading={heading}
          key={heading}
          rows={rows.map(row => ({ ...row, onChange: noop }))}
        />
      ))}
    </Panel>,
  ],
  [
    'Panel · Filters tab',
    <Panel
      bodyId='panel-filters'
      end={<Button>Clear filters</Button>}
      gap='l'
      key='filters'
      label='Layers and filters'
      onSelect={noop}
      selected='filters'
      tabs={panelTabs('panel-filters')}>
      {[
        <FilterFields
          branch=''
          branches={FILTER_BRANCHES}
          events={FILTER_EVENT_TYPES.map(({ value }) => value)}
          eventTypes={FILTER_EVENT_TYPES}
          key='fields'
          onBranchChange={noop}
          onEventToggle={noop}
          onPersonChange={noop}
          onSurnamesChange={noop}
          people={FILTER_PEOPLE}
          person=''
          surnameHelper={SURNAME_HELPER}
          surnames={['Rossouw']}
        />,
      ]}
    </Panel>,
  ],
  [
    'LayerGroup · rows on and off',
    <LayerGroup
      heading={LAYER_GROUPS[0].heading}
      key='group'
      rows={LAYER_GROUPS[0].rows.map(row => ({ ...row, onChange: noop }))}
    />,
  ],
  [
    'FilterFields · empty',
    <FilterFields
      branch=''
      branches={FILTER_BRANCHES}
      events={[]}
      eventTypes={FILTER_EVENT_TYPES}
      key='empty'
      onBranchChange={noop}
      onEventToggle={noop}
      onPersonChange={noop}
      onSurnamesChange={noop}
      people={FILTER_PEOPLE}
      person=''
      surnames={[]}
    />,
  ],
  [
    'FilterFields · with values',
    <FilterFields
      branch='ancestors'
      branches={FILTER_BRANCHES}
      events={['birth', 'marriage']}
      eventTypes={FILTER_EVENT_TYPES}
      key='values'
      onBranchChange={noop}
      onEventToggle={noop}
      onPersonChange={noop}
      onSurnamesChange={noop}
      people={FILTER_PEOPLE_WITH_ONE}
      person='p1'
      surnameHelper={SURNAME_HELPER}
      surnames={['Rossouw']}
    />,
  ],
  ...(['table', 'list'] as const).map((name): [string, ReactElement] => [
    `SourcesList · ${name}`,
    <SourcesList key={name} sources={sourceData.sources} />,
  ]),
  [
    'Credits · one line',
    <Credits
      collapsible
      key='line'
      onOpenAttributions={noop}
      showPolities
      sources={sourceData.sources}
    />,
  ],
  [
    'Credits · open',
    <Credits
      collapsible
      defaultOpen
      key='open'
      onOpenAttributions={noop}
      showPolities
      sources={sourceData.sources}
    />,
  ],
  [
    'Credits · full text',
    <Credits
      key='full'
      onOpenAttributions={noop}
      showPolities
      sources={sourceData.sources}
    />,
  ],
  ...(['error', 'info', 'success', 'warning'] as const).map(
    (tone): [string, ReactElement] => [
      `Alert · ${tone}`,
      <Alert key={tone} title='Title' tone={tone}>
        Something happened.
      </Alert>,
    ]
  ),
  ...(['error', 'success'] as const).map((tone): [string, ReactElement] => [
    `Toast · ${tone}`,
    <Toast action='Undo' key={tone} onDismiss={noop} tone={tone}>
      Done.
    </Toast>,
  ]),
  [
    'Banner · offline',
    <Banner action='Retry' icon='cloudOff' key='banner'>
      You are offline.
    </Banner>,
  ],
  [
    'Callout · error',
    <Callout id='callout-error' key='callout'>
      Enter a date.
    </Callout>,
  ],
  [
    'NoticeCard · one action',
    <NoticeCard
      actions={[{ label: 'Undo' }]}
      icon='info'
      key='one'
      title='Layer hidden'>
      The 1910 provinces are off.
    </NoticeCard>,
  ],
  [
    'NoticeCard · two actions',
    <NoticeCard
      actions={[{ label: 'Retry' }, { label: 'Dismiss' }]}
      icon='warning'
      key='two'
      title='Map not loaded'>
      Check your connection.
    </NoticeCard>,
  ],
  [
    'NoticeCard · link action',
    <NoticeCard
      actions={[{ href: '/people', label: 'See all people' }]}
      icon='info'
      key='link'
      title='No match'>
      Nobody has this name.
    </NoticeCard>,
  ],
  [
    'NoticeCard · loading',
    <NoticeCard key='loading' progress={40} title='Loading boundaries'>
      1910 of 1994.
    </NoticeCard>,
  ],
  [
    'NoticeCard · large',
    <NoticeCard icon='info' key='large' size='large' title='No ancestors yet'>
      Add a Person to see them on the map.
    </NoticeCard>,
  ],
  [
    'NoticeCard · phone',
    <NoticeCard
      actions={[{ label: 'Undo' }]}
      icon='info'
      key='phone'
      phone
      title='Layer hidden'>
      The 1910 provinces are off.
    </NoticeCard>,
  ],
  ...([0, 40, 100] as const).map((value, index): [string, ReactElement] => [
    `ProgressBar · ${value}`,
    <ProgressBar key={value} labelledBy={`ks-case-${index}`} value={value} />,
  ]),
  ...([168, 220] as const).map((width): [string, ReactElement] => [
    `LoadingBar · ${width}`,
    <LoadingBar key={width} width={width} />,
  ]),
  [
    'LoadingField · one bar',
    <LoadingField key='one' label='Precision' widths={[120]} />,
  ],
  [
    'LoadingField · two bars',
    <LoadingField key='two' label='Sources' widths={[220, 160]} />,
  ],
  ...states('Avatar', (state, disabled) => (
    <Avatar disabled={disabled} initial='R' state={state} />
  )),
  ['Avatar · open', <Avatar expanded initial='R' key='open' />],
  ['Divider · plain', <Divider key='plain' />],
  ['Divider · labelled', <Divider key='labelled' label='or' />],
  ...(Object.keys(PATHS) as (keyof typeof PATHS)[]).map(
    (name): [string, ReactElement] => [
      `Icon · ${name}`,
      <Icon key={name} name={name} />,
    ]
  ),
  ...([14, 16, 20, 24, 28] as const).map((size): [string, ReactElement] => [
    `Icon · search · ${size}`,
    <Icon key={size} name='search' size={size} />,
  ]),
  ...(['floating', 'modal', 'raised', 'sheet'] as const).map(
    (level): [string, ReactElement] => [
      `Surface · ${level}`,
      <Surface key={level} level={level}>
        Content
      </Surface>,
    ]
  ),
  ...HEADINGS.map(([variant, as]): [string, ReactElement] => [
    `Text · ${variant}`,
    <Text as={as} key={variant} variant={variant}>
      Sample
    </Text>,
  ]),
  ...OTHERS.map((variant): [string, ReactElement] => [
    `Text · ${variant}`,
    <Text key={variant} variant={variant}>
      Sample
    </Text>,
  ]),
  ...(['error', 'info', 'warning'] as const).map(
    (tone): [string, ReactElement] => [
      `Text · body · ${tone}`,
      <Text key={tone} tone={tone} variant='body'>
        Sample
      </Text>,
    ]
  ),
  ...([32, 36, 44] as const).map((size): [string, ReactElement] => [
    `Wordmark · ${size}`,
    <Wordmark key={size} size={size} />,
  ]),
  ['Wordmark · icon only', <Wordmark iconOnly key='icon' />],
  ...(['Map', 'People'] as const).map((name): [string, ReactElement] => [
    `PageHeader · ${name}`,
    <PageHeader
      avatar={<Avatar initial='R' />}
      backHref={`/${name.toLowerCase()}`}
      backLabel={name}
      key={name}
    />,
  ]),
  ...links('BackLink', state => (
    <BackLink href='/map' label='Map' state={state} />
  )),
  [
    'Menu · closed',
    <Menu {...ACCOUNT} initial='R' key='menu' onSelect={noop} />,
  ],
  ['MenuPanel · open', <MenuPanel {...ACCOUNT} key='open' onSelect={noop} />],
  [
    'MenuPanel · hovered',
    <MenuPanel {...ACCOUNT} hovered='sources' key='hovered' onSelect={noop} />,
  ],
  ...(['floating', 'sheet'] as const).map((form): [string, ReactElement] => [
    `Popup · ${form}`,
    <Popup
      chain={CHAIN}
      coordinates='28.738° S · 24.764° E'
      form={form}
      key={form}
      pins={PINS}
      place='Kimberley'
      year={1901}
    />,
  ]),
  ...(
    [
      ['loaded', 'floating'],
      ['loading', 'floating'],
      ['failed', 'floating'],
      ['loaded', 'sheet'],
    ] as const
  ).map(([state, form]): [string, ReactElement] => [
    `PinPopup · ${form === 'sheet' ? 'sheet' : state}`,
    <PinPopup
      address={
        state === 'loaded' ? 'Farm Example, district Example' : undefined
      }
      event='residence'
      form={form}
      key={`${state}-${form}`}
      name={state === 'loaded' ? 'Example Person' : undefined}
      reading='From 1890 to 1905'
      recorded='FROM 1890 TO 1905'
      state={state}
    />,
  ]),
  [
    'PlacedPopup · placed',
    <PlacedPopup
      chain={CHAIN}
      coordinates='28.738° S · 24.764° E'
      key='placed-popup'
      pins={PINS}
      place='Kimberley'
      x={PLACED_X}
      y={PLACED_Y}
      year={1901}
    />,
  ],
  [
    'ClickPopup · placed',
    <ClickPopup
      key='click-popup'
      onAdd={noop}
      point={CLICK_POINT}
      x={PLACED_X}
      y={PLACED_Y}
    />,
  ],
  [
    'PlacedPinPopup · placed',
    <PlacedPinPopup
      address='Farm Example, district Example'
      event='residence'
      key='placed-pin-popup'
      name='Example Person'
      reading='From 1890 to 1905'
      recorded='FROM 1890 TO 1905'
      state='loaded'
      x={PLACED_X}
      y={PLACED_Y}
    />,
  ],
  ...([false, true] as const).map((expanded): [string, ReactElement] => [
    `BottomSheet · ${expanded ? 'expanded' : 'collapsed'}`,
    <BottomSheet
      expanded={expanded}
      key={String(expanded)}
      onExpandedChange={noop}>
      Date controls
    </BottomSheet>,
  ]),
  [
    'Modal · open',
    <Modal aria-label='Modal' key='modal' onClose={noop} open>
      Content
    </Modal>,
  ],
  [
    'Dialog · centred',
    <Dialog
      footnote='Footnote'
      key='dialog'
      onClose={noop}
      open
      subtitle='Subtitle'
      title='Sources'>
      Content
    </Dialog>,
  ],
  ...(['centred', 'sheet'] as const).map((form): [string, ReactElement] => [
    `DialogPanel · ${form}`,
    <DialogPanel
      footnote='Footnote'
      form={form}
      key={form}
      subtitle='Subtitle'
      title='Sources'
      titleId={`dialog-${form}`}>
      Content
    </DialogPanel>,
  ]),
  [
    'Sheet · open',
    <Sheet key='sheet' onClose={noop} open title='Boards'>
      Content
    </Sheet>,
  ],
  [
    'SheetPanel · title',
    <SheetPanel key='title' title='Boards' titleId='sheet-title'>
      Content
    </SheetPanel>,
  ],
  [
    'SheetPanel · subtitle',
    <SheetPanel
      key='subtitle'
      subtitle='Subtitle'
      title='Sources'
      titleId='sheet-subtitle'>
      Content
    </SheetPanel>,
  ],
  [
    'SheetPanel · tabs',
    <SheetPanel
      key='tabs'
      tabs={{ label: 'Layers and filters', selected: 'layers', tabs: TABS }}
      titleId='sheet-tabs'>
      Content
    </SheetPanel>,
  ],
  ...(
    [
      ['list', 'People'],
      ['detail', 'Relationships'],
      ['form', 'Add a person'],
    ] as const
  ).map(([column, title]): [string, ReactElement] => [
    `ColumnLayout · ${column}`,
    <ColumnLayout
      column={column}
      header={<PageHeader backHref='/people' backLabel='People' />}
      key={column}>
      <Text as='h1' variant='h1'>
        {title}
      </Text>
      <Text variant='small'>Each change saves at once.</Text>
    </ColumnLayout>,
  ]),
  [
    'ColumnLayout · notice',
    <ColumnLayout
      column='notice'
      header={<PageHeader backHref='/people' backLabel='People' />}
      key='notice'>
      {[
        <NoticeCard
          actions={[{ href: '/people', label: 'Go to People' }]}
          icon='people'
          key='card'
          size='large'
          title='Person not found'>
          No one in your Tree has this address. The person may have been
          deleted, or the link is wrong.
        </NoticeCard>,
      ]}
    </ColumnLayout>,
  ],
  [
    'ColumnLayout · phone-notice',
    <ColumnLayout
      column='phone-notice'
      header={<PageHeader backHref='/people' backLabel='People' />}
      key='phone-notice'>
      {[
        <NoticeCard
          actions={[{ href: '/people', label: 'See all people' }]}
          key='card'
          phone
          title='Edit people on a computer'>
          People are added and edited on a larger screen. On a phone you can
          look them up.
        </NoticeCard>,
      ]}
    </ColumnLayout>,
  ],
  [
    'ColumnLayout · form with an action bar',
    <ColumnLayout
      actions={<Button variant='primary'>Save</Button>}
      column='form'
      header={<PageHeader backHref='/people' backLabel='People' />}
      key='bar'>
      <Text as='h1' variant='h1'>
        Add a person
      </Text>
      <Text variant='small'>Each change saves at once.</Text>
    </ColumnLayout>,
  ],
  [
    'SignInLayout · hero and form',
    <SignInLayout
      hero={
        <Text as='h1' variant='h1'>
          Your family, where they were.
        </Text>
      }
      key='sign-in'>
      {[
        <Text key='form' variant='small'>
          Sign in to see your family on the map.
        </Text>,
      ]}
    </SignInLayout>,
  ],
  [
    'MapLayout · text in each slot',
    <MapLayout
      account={<Text variant='small'>account</Text>}
      action={<Text variant='small'>action</Text>}
      credits={<Text variant='small'>credits</Text>}
      dock={<Text variant='small'>dock</Text>}
      key='map'
      layers={<Text variant='small'>layers</Text>}
      overlay={<Text variant='small'>overlay</Text>}
      panel={<Text variant='small'>panel</Text>}
      search={<Text variant='small'>search</Text>}
      zoom={<Text variant='small'>zoom</Text>}>
      {[
        <Text key='map' variant='small'>
          The map
        </Text>,
      ]}
    </MapLayout>,
  ],
  [
    'MapLayout · overlay at the top',
    <MapLayout
      account={<Text variant='small'>account</Text>}
      action={<Text variant='small'>action</Text>}
      credits={<Text variant='small'>credits</Text>}
      dock={<Text variant='small'>dock</Text>}
      key='map-top'
      layers={<Text variant='small'>layers</Text>}
      overlay={<Text variant='small'>overlay</Text>}
      overlayAt='top'
      panel={<Text variant='small'>panel</Text>}
      search={<Text variant='small'>search</Text>}
      zoom={<Text variant='small'>zoom</Text>}>
      {[
        <Text key='map' variant='small'>
          The map
        </Text>,
      ]}
    </MapLayout>,
  ],
];

/**
 * Registers the console checks of a test file, and returns the check to call in a test.
 * Unmounts before the last check, so what React logs on unmount fails the test too.
 */
export const registerConsoleChecks = () => {
  let errors: ReturnType<typeof vi.spyOn>;
  let warnings: ReturnType<typeof vi.spyOn>;

  const quiet = () => {
    expect(errors.mock.calls).toEqual([]);
    expect(warnings.mock.calls).toEqual([]);
  };

  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    try {
      quiet();
    } finally {
      vi.restoreAllMocks();
    }
  });

  return quiet;
};
