import type { ReactElement } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Button } from '@ks/app/components/actions/Button';
import { Chip } from '@ks/app/components/actions/Chip';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { Tabs } from '@ks/app/components/actions/Tabs';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Toast } from '@ks/app/components/feedback/Toast';
import { Checkbox } from '@ks/app/components/forms/Checkbox';
import { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import { TextField } from '@ks/app/components/forms/TextField';
import { DateField } from '@ks/features/map/components/DateField';
import { toDay } from '@ks/lib/domain/boundaries/model.mts';
import { MIN_DAY } from '@ks/lib/domain/map/map-date';

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
  ...states('Checkbox', (state, disabled) => (
    <Checkbox aria-label='Deceased' disabled={disabled} state={state} />
  )),
  ...states('CheckboxField', (state, disabled) => (
    <CheckboxField
      description='Only people born before 1920.'
      disabled={disabled}
      label='Deceased'
      state={state}
    />
  )),
  ['CheckboxField · plain', <CheckboxField key='n' label='Keep me' plain />],
  ...states('DateField', (state, disabled) =>
    dateField({ state: disabled ? undefined : state })
  ),
  ['DateField · error', dateField({ defaultText: '1901-02-30' })],
  [
    'DateField · notice',
    dateField({ notice: { text: 'Moved to 1652.', tone: 'warning' } }),
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
];

let errors: ReturnType<typeof vi.spyOn>;
let warnings: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const quiet = () => {
  expect(errors.mock.calls).toEqual([]);
  expect(warnings.mock.calls).toEqual([]);
};

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
    vi.useRealTimers();
    quiet();
  });

  it('Alert renders only', () => {
    render(<Alert tone='warning'>Check this.</Alert>);
    expect(screen.getByRole('status').textContent).toContain('Check this.');
    quiet();
  });
});
