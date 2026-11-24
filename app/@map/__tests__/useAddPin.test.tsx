import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const form = vi.hoisted(() => vi.fn());

const pinEdit = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/@map/actions', () => ({
  createPinAction: vi.fn(),
  updatePinAction: vi.fn(),
}));
const writePin = vi.hoisted(() => vi.fn());

vi.mock('@ks/features/pins', () => ({
  usePinEdit: pinEdit,
  useWritePin: () => writePin,
}));
vi.mock('@ks/features/people', () => ({
  PinForm: (props: {
    edit?: { id: string; query: unknown };
    onCancel: () => void;
    onSave: (input: unknown) => Promise<{ ok: boolean }>;
    onSaved: () => void;
    place?: { id: string };
    point?: { latitude: number; longitude: number };
  }) => {
    form(props);

    return (
      <div>
        <span data-testid='form-place'>{props.place?.id ?? ''}</span>
        <span data-testid='form-edit'>{props.edit?.id ?? ''}</span>
        <input aria-label='Typed' defaultValue='' />
        <span data-testid='form-point'>
          {props.point
            ? `${props.point.latitude},${props.point.longitude}`
            : ''}
        </span>
        <button onClick={props.onCancel} type='button'>
          Cancel form
        </button>
        <button onClick={props.onSaved} type='button'>
          Saved form
        </button>
      </div>
    );
  },
}));

import type { PinId, PlaceId } from '@ks/lib/domain/ids/types.ts';

import { createPinAction, updatePinAction } from '@ks/app/@map/actions';
import { useAddPin } from '@ks/app/@map/useAddPin';

// PIN-01, NFR-05
const MAP_PIN = { id: 'mapped' };
const PIN_1 = '01900000-0000-7000-b000-0000000000d1' as PinId;
const PIN_2 = '01900000-0000-7000-b000-0000000000d2' as PinId;

const PLACE_1 = {
  id: 'place-1' as PlaceId,
  latitude: -29.12,
  longitude: 26.21,
  precision: 'farm',
} as const;
const PLACE_2 = {
  ...PLACE_1,
  id: 'place-2' as PlaceId,
  precision: 'town',
} as const;

const Probe = () => {
  const { action, addHere, click, closeClick, edit, onEmptyClick, panel } =
    useAddPin();

  return (
    <>
      <button onClick={() => edit?.(PIN_1)} type='button'>
        Edit 1
      </button>
      <button onClick={() => edit?.(PIN_2)} type='button'>
        Edit 2
      </button>
      <button onClick={() => addHere?.(PLACE_1)} type='button'>
        Here 1
      </button>
      <button onClick={() => addHere?.(PLACE_2)} type='button'>
        Here 2
      </button>
      <div data-testid='action'>{action}</div>
      <div data-testid='panel'>{panel}</div>
      <div data-testid='click'>
        {click && (
          <span data-testid='position'>{click.position.join(',')}</span>
        )}
        {click?.popup({ x: 30, y: 40 })}
      </div>
      <button
        onClick={() => onEmptyClick?.({ latitude: -28.5, longitude: 25.5 })}
        type='button'>
        Empty click
      </button>
      <button
        onClick={() => onEmptyClick?.({ latitude: -30.25, longitude: 20.75 })}
        type='button'>
        Other empty click
      </button>
      <button onClick={closeClick} type='button'>
        Pin click
      </button>
    </>
  );
};

const emptyClick = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Empty click' }));

const desktop = window.matchMedia;
const slot = (name: string) => screen.getByTestId(name);

beforeEach(() => {
  writePin.mockReset();
  form.mockReset();
  pinEdit.mockReset();
  pinEdit.mockReturnValue({ data: undefined });
});

afterEach(() => {
  window.matchMedia = desktop;
});

it('gives the button while the panel is closed, and the panel while it is open', () => {
  render(<Probe />);

  expect(slot('panel').textContent).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  expect(slot('action').textContent).toBe('');
  expect(slot('panel').textContent).toContain('Cancel form');
});

it('closes the panel on cancel and gives the button again', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

  expect(slot('panel').textContent).toBe('');
  expect(screen.getByRole('button', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect(writePin).not.toHaveBeenCalled();
});

it('closes the panel after a save, and leaves the Pins to the save itself', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  fireEvent.click(screen.getByRole('button', { name: 'Saved form' }));

  expect(slot('panel').textContent).toBe('');
  expect(writePin).not.toHaveBeenCalled();
});

it('saves with createPinAction, gives back its answer, and writes the MapPin of a saved Pin', async () => {
  const answer = { ok: true, value: MAP_PIN } as never;

  vi.mocked(createPinAction).mockResolvedValue(answer);
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const result = await form.mock.calls[0][0].onSave({ id: 'p' });

  expect(createPinAction).toHaveBeenCalledWith({ id: 'p' });
  expect(result).toEqual(answer);
  expect(writePin).toHaveBeenCalledExactlyOnceWith(MAP_PIN);
});

it('writes for a save that finishes after the panel closed, and not for a failed save', async () => {
  let finish!: (value: never) => void;

  vi.mocked(createPinAction).mockReturnValueOnce(
    new Promise(done => {
      finish = done;
    })
  );
  vi.mocked(createPinAction).mockResolvedValueOnce({ ok: false } as never);
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const pending = form.mock.calls[0][0].onSave({});

  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
  expect(slot('panel').textContent).toBe('');
  finish({ ok: true, value: MAP_PIN } as never);
  await pending;
  expect(writePin).toHaveBeenCalledExactlyOnceWith(MAP_PIN);

  await form.mock.calls[0][0].onSave({});
  expect(writePin).toHaveBeenCalledTimes(1);
});

// PIN-01
it('opens the click popup at the point of a click on empty map, and keeps the button', () => {
  render(<Probe />);
  emptyClick();

  expect(slot('position').textContent).toBe('25.5,-28.5');
  expect(screen.getByRole('dialog', { name: 'Add a pin here' })).toBeInstanceOf(
    HTMLElement
  );
  expect(screen.getByText('-28.500000, 25.500000')).toBeInstanceOf(HTMLElement);
  expect(screen.getByRole('button', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect(slot('panel').textContent).toBe('');
});

// PIN-01
it('moves the popup to the next click', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Other empty click' }));

  expect(slot('position').textContent).toBe('20.75,-30.25');
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
});

// PIN-01
it('opens the panel with the clicked point from "Add a pin here", and closes the popup', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin here' }));

  expect(slot('click').textContent).toBe('');
  expect(slot('form-point').textContent).toBe('-28.5,25.5');
  expect(slot('action').textContent).toBe('');
});

// PIN-01
it('closes the popup from Close, and from a free Esc', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(slot('click').textContent).toBe('');

  emptyClick();
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(slot('click').textContent).toBe('');

  emptyClick();
  fireEvent.keyDown(document.body, { key: 'a' });
  expect(slot('position').textContent).toBe('25.5,-28.5');
});

// PIN-01
it('closes the popup on a Pin click, and leaves a closed state alone', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Pin click' }));
  expect(slot('click').textContent).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Pin click' }));
  expect(slot('click').textContent).toBe('');
});

// PIN-01
it('opens the panel empty from "Add a pin" and closes the popup', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  expect(slot('click').textContent).toBe('');
  expect(slot('panel').textContent).toContain('Cancel form');
  expect(slot('form-point').textContent).toBe('');
});

// PIN-01
it('changes the point of the open panel on a click, and opens no popup', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  emptyClick();
  expect(slot('form-point').textContent).toBe('-28.5,25.5');
  expect(slot('click').textContent).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Other empty click' }));
  expect(slot('form-point').textContent).toBe('-30.25,20.75');
});

// PIN-01
it('keeps the point of the open panel on a Pin click', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin here' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pin click' }));
  expect(slot('form-point').textContent).toBe('-28.5,25.5');
});

// PIN-01
it('gives the button again after the panel of a click closes', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin here' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
  expect(slot('panel').textContent).toBe('');
  expect(screen.getByRole('button', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
});

// PIN-01, PIN-06
it('opens the panel at an existing Place from addHere, and gives no button', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));

  expect(slot('form-place').textContent).toBe('place-1');
  expect(slot('action').textContent).toBe('');
});

// PIN-01, PIN-06
it('keeps the Place and opens no popup on a click on empty map', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));
  emptyClick();

  expect(slot('form-place').textContent).toBe('place-1');
  expect(slot('form-point').textContent).toBe('');
  expect(slot('click').textContent).toBe('');
});

// PIN-01, PIN-06
it('switches to another Place and clears the typed values', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Here 2' }));

  expect(slot('form-place').textContent).toBe('place-2');
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');
});

// PIN-01, PIN-06
it('clears the typed values for the same Place chosen again', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));

  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');
});

// PIN-01
it('closes the click popup when addHere opens the panel', () => {
  render(<Probe />);
  emptyClick();
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));

  expect(slot('click').textContent).toBe('');
});

// PIN-02
it('opens the edit panel for a Pin, asks for its fields, and gives no button', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));

  expect(slot('form-edit').textContent).toBe(PIN_1);
  expect(pinEdit).toHaveBeenCalledWith(PIN_1);
  expect(slot('action').textContent).toBe('');
});

// PIN-02
it('asks for no fields before "Edit"', () => {
  render(<Probe />);

  expect(pinEdit).not.toHaveBeenCalled();
});

// PIN-02
it('switches to another Pin and clears the typed values, and does the same for the same Pin', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Edit 2' }));

  expect(slot('form-edit').textContent).toBe(PIN_2);
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');

  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Edit 2' }));
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');
});

// PIN-02
it('replaces an open add panel with the edit panel, and drops the typed values', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));

  expect(slot('form-edit').textContent).toBe(PIN_1);
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');
});

// PIN-02
it('replaces an open edit panel with the add panel at a Place, and drops the typed values', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));

  expect(slot('form-edit').textContent).toBe('');
  expect(slot('form-place').textContent).toBe('place-1');
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe('');
});

// PIN-02
it('keeps the edit panel on a Pin click', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pin click' }));
  expect(slot('form-edit').textContent).toBe(PIN_1);
});

// PIN-02
it('changes nothing on a click on empty map while the edit panel is open', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  emptyClick();

  expect(slot('click').textContent).toBe('');
  expect(slot('form-edit').textContent).toBe(PIN_1);
  expect(slot('form-point').textContent).toBe('');
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe(
    'typed'
  );
});

// PIN-02
it('closes the edit panel on cancel, and gives the button again', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

  expect(slot('panel').textContent).toBe('');
  expect(screen.getByRole('button', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
  expect(writePin).not.toHaveBeenCalled();
});

// PIN-02
it('saves an edit with updatePinAction, and writes the MapPin of a saved Pin only', async () => {
  vi.mocked(updatePinAction).mockResolvedValueOnce({
    ok: true,
    value: MAP_PIN,
  } as never);
  vi.mocked(updatePinAction).mockResolvedValueOnce({ ok: false } as never);
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));

  const { onSave } = form.mock.calls[0][0];

  expect(await onSave({ id: 'p' })).toEqual({ ok: true, value: MAP_PIN });
  expect(updatePinAction).toHaveBeenCalledWith({ id: 'p' });
  expect(createPinAction).not.toHaveBeenCalled();
  expect(writePin).toHaveBeenCalledExactlyOnceWith(MAP_PIN);

  await onSave({ id: 'p' });
  expect(writePin).toHaveBeenCalledTimes(1);
});

// PIN-02
it('closes the edit panel after a save', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Saved form' }));

  expect(slot('panel').textContent).toBe('');
});

// NFR-05
// PIN-02
it('keeps the newer panel open when the save of an older panel ends', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit 1' }));

  const older = form.mock.calls.at(-1)![0].onSaved as () => void;

  fireEvent.click(screen.getByRole('button', { name: 'Here 1' }));
  fireEvent.change(screen.getByLabelText('Typed'), {
    target: { value: 'typed' },
  });
  act(() => older());

  expect(slot('form-place').textContent).toBe(PLACE_1.id);
  expect((screen.getByLabelText('Typed') as HTMLInputElement).value).toBe(
    'typed'
  );
});

// PIN-01
it('keeps the click popup open when the save of an older panel ends', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const older = form.mock.calls.at(-1)![0].onSaved as () => void;

  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
  emptyClick();
  act(() => older());

  expect(slot('position').textContent).toBe('25.5,-28.5');
});

// PIN-01
it('leaves a closed flow closed when the save of an older panel ends', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const older = form.mock.calls.at(-1)![0].onSaved as () => void;

  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
  act(() => older());

  expect(slot('panel').textContent).toBe('');
});

// PIN-01
it('keeps a new add panel open when the save of an older add panel ends', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const older = form.mock.calls.at(-1)![0].onSaved as () => void;

  fireEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  act(() => older());

  expect(slot('panel').textContent).toContain('Cancel form');
});

it('opens nothing on a click on a phone', () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  render(<Probe />);
  emptyClick();

  expect(slot('click').textContent).toBe('');
  expect(slot('panel').textContent).toBe('');
});

// NFR-05
it('starts closed when the screen goes back to a desktop width after a phone width', () => {
  const listeners = new Set<() => void>();
  const query = {
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    matches: false,
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  };

  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;

  const resize = (next: boolean) => {
    query.matches = next;
    act(() => listeners.forEach(listener => listener()));
  };

  render(<Probe />);
  emptyClick();
  resize(true);
  resize(false);
  expect(slot('click').textContent).toBe('');

  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  resize(true);
  resize(false);
  expect(slot('panel').textContent).toBe('');
  expect(screen.getByRole('button', { name: 'Add a pin' })).toBeInstanceOf(
    HTMLElement
  );
});

it('gives neither the button nor the panel on a phone', () => {
  window.matchMedia = (() => ({
    addEventListener: () => {},
    matches: true,
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  render(<Probe />);

  expect(slot('action').textContent).toBe('');
  expect(slot('panel').textContent).toBe('');
  expect(form).not.toHaveBeenCalled();
});
