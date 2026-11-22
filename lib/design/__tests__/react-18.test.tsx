import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@ks/app/components/actions/Button';
import { Chip } from '@ks/app/components/actions/Chip';
import { ChipGroup } from '@ks/app/components/actions/ChipGroup';
import { IconButton } from '@ks/app/components/actions/IconButton';
import { Segmented } from '@ks/app/components/actions/Segmented';
import { Tabs } from '@ks/app/components/actions/Tabs';
import { Alert } from '@ks/app/components/feedback/Alert';
import { Banner } from '@ks/app/components/feedback/Banner';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { ProgressBar } from '@ks/app/components/feedback/ProgressBar';
import { Toast } from '@ks/app/components/feedback/Toast';
import { Checkbox } from '@ks/app/components/forms/Checkbox';
import { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import { SelectField } from '@ks/app/components/forms/SelectField';
import { TextField } from '@ks/app/components/forms/TextField';
import { TokenField } from '@ks/app/components/forms/TokenField';
import { DialogPanel } from '@ks/app/components/overlays/Dialog';
import { Menu } from '@ks/app/components/overlays/Menu';
import {
  ACCOUNT,
  CASES,
  dateField,
  OPTIONS,
  POLITIES,
  registerConsoleChecks,
  SEGMENTS,
  TABS,
} from '@ks/lib/design/__tests__/react-18-cases';
import { FORM_ATTRIBUTE } from '@ks/lib/design/cards.mts';
import { CARDS } from '@ks/lib/design/states.mts';

// The shared controls (DS.5) must work in the React 18 the design system targets as well as the app's 19.

const quiet = registerConsoleChecks();

it('runs on React 18, with one React', () => {
  const Hook = () => React.useState('hooked')[0];

  expect(React.version).toMatch(/^18\./);
  expect(ReactDOM.version).toMatch(/^18\./);
  render(<Hook />);
  screen.getByText('hooked');
  quiet();
});

describe('states', () => {
  it.each(CASES)('%s renders with no error or warning', (_name, element) => {
    render(element);
    quiet();
  });
});

it('names the form attribute that DialogPanel sets, and the form of the list state', () => {
  const { container } = render(
    <DialogPanel form='sheet' title='Sources' titleId='dialog-attribute'>
      Content
    </DialogPanel>
  );
  const list = CARDS.find(({ name }) => name === 'SourcesList')!.states[1];

  expect(
    container.querySelector(`[${FORM_ATTRIBUTE}]`)?.getAttribute(FORM_ATTRIBUTE)
  ).toBe(list.form?.name);
  quiet();
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
    screen.getByRole('alert');
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

    render(<Menu {...ACCOUNT} initial='R' onSelect={onSelect} />);

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
