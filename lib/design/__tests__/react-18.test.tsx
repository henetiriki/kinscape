import type { DOMWindow } from 'jsdom';
import type { ReactElement } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as React from 'react';
import { isValidElement } from 'react';
import * as ReactDOM from 'react-dom';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { standInDom } from '@ks/__tests__/dom-stand-ins';
import { ActionBar } from '@ks/app/components/actions/ActionBar';
import { Button } from '@ks/app/components/actions/Button';
import { Chip, RemovableChip } from '@ks/app/components/actions/Chip';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { KeyHint } from '@ks/app/components/actions/KeyHint';
import { PersonRow } from '@ks/app/components/actions/PersonRow';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { Tabs } from '@ks/app/components/actions/Tabs';
import { TextLink } from '@ks/app/components/actions/TextLink';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Banner } from '@ks/app/components/feedback/Banner';
import { Callout } from '@ks/app/components/feedback/Callout';
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
import { BottomSheet } from '@ks/app/components/overlays/BottomSheet';
import { Dialog, DialogPanel } from '@ks/app/components/overlays/Dialog';
import { Menu, MenuPanel } from '@ks/app/components/overlays/Menu';
import { Modal } from '@ks/app/components/overlays/Modal';
import { Popup } from '@ks/app/components/overlays/Popup';
import { Sheet, SheetPanel } from '@ks/app/components/overlays/Sheet';
import { CHAIN, PINS } from '@ks/app/design-kit/surfaces/data';
import { DateField } from '@ks/features/map/components/DateField';
import { CONTROLS } from '@ks/lib/design/bundle.mts';
import { LONG_NOTES } from '@ks/lib/design/samples.mts';
import { CARDS } from '@ks/lib/design/states.mts';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { MIN_DAY } from '@ks/lib/domain/map/map-date.mts';
import { run } from '@ks/scripts/design-system.mts';

// The shared controls (DS.5) must work in the React 18 the design system targets as well as the app's 19.

const STATES = ['active', 'focus', 'hover'] as const;
const TODAY = toDay('2026-10-21');
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
] as const;
const POLITIES = [
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
const ACCOUNT = {
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

const COMPONENTS = {
  ActionBar,
  Alert,
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
  DateField,
  Dialog,
  DialogPanel,
  Divider,
  Icon,
  IconButton,
  KeyHint,
  Menu,
  MenuPanel,
  Modal,
  NoticeCard,
  PageHeader,
  PersonRow,
  Popup,
  ProgressBar,
  RemovableChip,
  Segmented,
  SelectField,
  Sheet,
  SheetPanel,
  Surface,
  Tabs,
  Text,
  TextAreaField,
  TextField,
  TextLink,
  Toast,
  TokenField,
  Wordmark,
};

/** A control in a prop or in the children, as a card lists it. */
const toSlot = (element: ReactElement<{ children?: string }>) => {
  const { children, ...props } = element.props;

  return {
    children,
    control: Object.entries(COMPONENTS).find(
      ([, type]) => type === element.type
    )![0],
    props,
  };
};

const slotted = (value: unknown): unknown =>
  isValidElement(value)
    ? toSlot(value as ReactElement<{ children?: string }>)
    : Array.isArray(value)
      ? value.map(slotted)
      : value;

const noop = () => {};
const dateField = (props: Partial<Parameters<typeof DateField>[0]> = {}) => (
  <DateField
    day={toDay('1901-06-14')}
    max={TODAY}
    min={MIN_DAY}
    onChange={noop}
    precision='day'
    {...props}
  />
);

const CASES: [string, ReactElement][] = [
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
      died='1901'
      givenNames='Susanna'
      href='/people/1'
      maidenName='Fourie'
      state={state}
      surname='Botha'
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
  ...(
    [
      ['default', {}],
      ['hover', { state: 'hover' }],
      ['focus', { state: 'focus' }],
      ['disabled', { disabled: true }],
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
  ...states('SelectField', (state, disabled) => (
    <SelectField
      disabled={disabled}
      label='Polity'
      options={POLITIES}
      state={state}
    />
  )),
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
  ...states('Avatar', (state, disabled) => (
    <Avatar disabled={disabled} initial='L' state={state} />
  )),
  ['Avatar · open', <Avatar expanded initial='L' key='open' />],
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
      avatar={<Avatar initial='L' />}
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
    <Menu {...ACCOUNT} initial='L' key='menu' onSelect={noop} />,
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
];

let errors: ReturnType<typeof vi.spyOn>;
let warnings: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const quiet = () => {
  expect(errors.mock.calls).toEqual([]);
  expect(warnings.mock.calls).toEqual([]);
};

// Unmount before the last check, so what React logs on unmount fails the test too.
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  try {
    quiet();
  } finally {
    vi.restoreAllMocks();
  }
});

it('runs on React 18, with one React', () => {
  const Hook = () => React.useState('hooked')[0];

  expect(React.version).toMatch(/^18\./);
  expect(ReactDOM.version).toMatch(/^18\./);
  render(<Hook />);
  expect(screen.getByText('hooked')).toBeTruthy();
  quiet();
});

describe('states', () => {
  it.each(CASES)('%s renders with no error or warning', (_name, element) => {
    render(element);
    quiet();
  });
});

describe('bundle', () => {
  const read = (path: string) => readFileSync(path, 'utf8');
  const problems: string[] = [];
  let out: string;
  let page: DOMWindow;

  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'react-18-bundle-'));
    await run('.', out);

    const virtualConsole = new VirtualConsole();

    for (const kind of ['error', 'jsdomError', 'warn'] as const) {
      virtualConsole.on(kind, (message: unknown) =>
        problems.push(`${kind}: ${String(message)}`)
      );
    }

    // A blank page with React 18 and the stylesheet, as the Design System type gives a preview.
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      runScripts: 'outside-only',
      virtualConsole,
    });

    page = dom.window;
    standInDom(page);
    page.document.head.innerHTML = `<style>${read(join(out, 'project/components/bundle.css'))}</style>`;
    page.eval(read('node_modules/react-18/umd/react.development.js'));
    page.eval(read('node_modules/react-dom-18/umd/react-dom.development.js'));
    page.eval(read(join(out, 'project/components/bundle.js')));
  }, 120_000);

  afterAll(() => {
    page.close();
    rmSync(out, { force: true, recursive: true });
  });

  it('puts every control on window.KinScape', () => {
    expect(
      Object.keys((page as unknown as { KinScape: object }).KinScape).toSorted()
    ).toEqual(CONTROLS.map(({ name }) => name).toSorted());
    expect(CONTROLS.map(({ name }) => name).toSorted()).toEqual(
      Object.keys(COMPONENTS).toSorted()
    );
    expect(problems).toEqual([]);
  });

  it.each(Object.entries(COMPONENTS))(
    '%s mounts with the props of its first case',
    (name, component) => {
      const first = CASES.find(([, element]) => element.type === component);
      const {
        KinScape,
        React: pageReact,
        ReactDOM: pageDom,
      } = page as unknown as {
        KinScape: Record<string, unknown>;
        React: typeof React;
        ReactDOM: typeof ReactDOM & {
          createRoot: (node: Element) => {
            render: (el: unknown) => void;
            unmount: () => void;
          };
        };
      };
      const root = page.document.createElement('div');
      const reactRoot = pageDom.createRoot(root);

      page.document.body.append(root);
      pageDom.flushSync(() =>
        reactRoot.render(
          pageReact.createElement(
            KinScape[name] as never,
            (first as [string, ReactElement])[1].props as never
          )
        )
      );
      expect(root.innerHTML).not.toBe('');
      pageDom.flushSync(() => reactRoot.unmount());
      expect(problems).toEqual([]);
    }
  );

  describe('previews', () => {
    const noFunctions = (props: object) =>
      Object.fromEntries(
        Object.entries(props)
          .filter(([, value]) => typeof value !== 'function')
          .map(([key, value]) => [key, slotted(value)])
      );

    it.each(CARDS.map(card => [card.name, card] as const))(
      '%s lists the states of the design kit, with the same props',
      (name, card) => {
        const cases = CASES.filter(
          ([, element]) =>
            element.type === COMPONENTS[name as keyof typeof COMPONENTS]
        );

        expect(card.states.map(({ label }) => label)).toEqual(
          cases.map(([label]) => label)
        );
        expect(
          card.states.map(({ children, props, slots }) => ({
            ...props,
            ...slots,
            children,
          }))
        ).toEqual(
          cases.map(([, element]) => noFunctions(element.props as object))
        );
      }
    );

    it.each(CARDS.map(card => [card.name, card] as const))(
      '%s preview mounts every state with no error',
      (name, card) => {
        const html = read(
          join(out, 'project/components', name, 'preview.html')
        );
        const script = /<script>([\s\S]*)<\/script>/i.exec(html)![1];

        page.document.body.innerHTML = '<div id="root"></div>';
        page.eval(script);
        expect(
          [...page.document.querySelectorAll('figcaption')].map(
            caption => caption.textContent
          )
        ).toEqual(card.states.map(({ label }) => label));
        expect(
          page.document.querySelectorAll('figure > :not(figcaption)')
        ).toHaveLength(card.states.length);
        expect(
          [...page.document.querySelectorAll('[aria-labelledby]')].filter(
            each =>
              !page.document.getElementById(
                each.getAttribute('aria-labelledby')!
              )
          )
        ).toEqual([]);
        expect(problems).toEqual([]);
      }
    );
  });
});

describe('interactions', () => {
  it('Button and IconButton are clicked', () => {
    const onClick = vi.fn();

    render(
      <>
        <Button onClick={onClick}>Copy chain</Button>
        <IconButton label='Zoom in' onClick={onClick}>
          +
        </IconButton>
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy chain' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onClick).toHaveBeenCalledTimes(2);
    quiet();
  });

  it('Chip is clicked and says whether it is on', () => {
    const onClick = vi.fn();

    render(
      <Chip on onClick={onClick}>
        Birth
      </Chip>
    );

    const chip = screen.getByRole('button', { name: 'Birth' });

    expect(chip.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
    quiet();
  });

  it('ChipGroup toggles the clicked chip', () => {
    const onToggle = vi.fn();

    render(
      <ChipGroup
        label='Event type'
        onToggle={onToggle}
        options={[...OPTIONS]}
        selected={['birth']}
      />
    );
    expect(
      screen.getAllByRole('button').map(c => c.getAttribute('aria-pressed'))
    ).toEqual(['true', 'false', 'false']);
    fireEvent.click(screen.getByRole('button', { name: /Marriage/ }));
    expect(onToggle).toHaveBeenCalledWith('marriage');
    quiet();
  });

  it('Segmented reports the chosen option', () => {
    const onChange = vi.fn();

    render(
      <Segmented
        label='View'
        name='view'
        onChange={onChange}
        options={SEGMENTS}
        value='map'
      />
    );
    fireEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(onChange).toHaveBeenCalledWith('list');
    quiet();
  });

  it('TextField takes typed text', () => {
    const onChange = vi.fn();

    render(<TextField label='Name' onChange={onChange} />);

    const field = screen.getByRole('textbox', {
      name: 'Name',
    }) as HTMLInputElement;

    fireEvent.change(field, { target: { value: 'Ada' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(field.value).toBe('Ada');
    quiet();
  });

  it('Checkbox and CheckboxField tick', () => {
    render(
      <>
        <Checkbox aria-label='Alone' />
        <CheckboxField label='Deceased' />
      </>
    );

    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];

    boxes.forEach(box => fireEvent.click(box));
    expect(boxes.map(box => box.checked)).toEqual([true, true]);
    quiet();
  });

  it('Tabs select and focus the next tab on ArrowRight', () => {
    const onSelect = vi.fn();

    render(
      <Tabs label='Panels' onSelect={onSelect} selected='layers' tabs={TABS} />
    );

    const [layers, filters] = screen.getAllByRole('tab');

    fireEvent.keyDown(layers, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('filters');
    expect(document.activeElement).toBe(filters);
    quiet();
  });

  it('DateField shows its alert for 1652-13-01 on Enter', () => {
    const onChange = vi.fn();

    render(dateField({ onChange }));

    const field = screen.getByRole('textbox', { name: 'Date shown' });

    fireEvent.change(field, { target: { value: '1652-13-01' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
    quiet();
  });

  it('Toast is dismissed by Esc and by its action', () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <Toast
        action='Try again'
        onAction={onAction}
        onDismiss={onDismiss}
        tone='error'>
        Failed.
      </Toast>
    );
    fireEvent.keyDown(screen.getByRole('alert'), { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(2);
    quiet();
  });

  it('Toast asks to be removed after its time', () => {
    vi.useFakeTimers();

    const onDismiss = vi.fn();

    render(
      <Toast onDismiss={onDismiss} tone='success'>
        Copied.
      </Toast>
    );
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
    quiet();
  });

  it('Menu opens, and Esc and a selection close it to the Avatar', () => {
    const onSelect = vi.fn();

    render(<Menu {...ACCOUNT} initial='L' onSelect={onSelect} />);

    const avatar = screen.getByRole('button', { name: 'Account menu' });

    fireEvent.click(avatar);
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(avatar);
    fireEvent.click(avatar);
    fireEvent.click(screen.getByRole('menuitem', { name: /Sources/ }));
    expect(onSelect).toHaveBeenCalledWith('sources');
    expect(document.activeElement).toBe(avatar);
    quiet();
  });

  it('TokenField adds on Enter, and removes with × and Backspace', () => {
    const onChange = vi.fn();

    render(
      <TokenField
        defaultValues={['Birth']}
        label='Event types'
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox', {
      name: 'Event types',
    }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Death' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(['Birth', 'Death']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Birth' }));
    expect(onChange).toHaveBeenLastCalledWith(['Death']);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenLastCalledWith([]);
    quiet();
  });

  it('SelectField reports the chosen option', () => {
    const onChange = vi.fn();

    render(
      <SelectField label='Polity' onChange={onChange} options={POLITIES} />
    );

    const select = screen.getByRole('combobox', {
      name: 'Polity',
    }) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'natal' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(select.value).toBe('natal');
    quiet();
  });

  it('Banner and NoticeCard run their actions', () => {
    const onAction = vi.fn();
    const onClick = vi.fn();

    render(
      <>
        <Banner action='Retry' icon='cloudOff' onAction={onAction}>
          You are offline.
        </Banner>
        <NoticeCard actions={[{ label: 'Undo', onClick }]} title='Layer hidden'>
          The 1910 provinces are off.
        </NoticeCard>
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
    quiet();
  });

  it('ProgressBar takes its name from the element that labelledBy names', () => {
    render(
      <>
        <span id='loading'>Loading boundaries</span>
        <ProgressBar labelledBy='loading' value={40} />
      </>
    );

    const bar = screen.getByRole('progressbar', { name: 'Loading boundaries' });

    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    quiet();
  });

  it('Alert renders only', () => {
    render(<Alert tone='warning'>Check this.</Alert>);
    expect(screen.getByRole('status').textContent).toContain('Check this.');
    quiet();
  });
});
