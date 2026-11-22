import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const form = vi.hoisted(() => vi.fn());

vi.mock('@ks/app/@map/actions', () => ({ createPinAction: vi.fn() }));
vi.mock('@ks/features/people', () => ({
  PinForm: (props: {
    onCancel: () => void;
    onSave: (input: unknown) => Promise<{ ok: boolean }>;
    onSaved: () => void;
  }) => {
    form(props);

    return (
      <div>
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

import { createPinAction } from '@ks/app/@map/actions';
import { useAddPin } from '@ks/app/@map/useAddPin';

// PIN-01, NFR-05
const onSaved = vi.fn();

const Probe = () => {
  const { action, panel } = useAddPin({ onSaved });

  return (
    <>
      <div data-testid='action'>{action}</div>
      <div data-testid='panel'>{panel}</div>
    </>
  );
};

const desktop = window.matchMedia;
const slot = (name: string) => screen.getByTestId(name);

beforeEach(() => {
  onSaved.mockReset();
  form.mockReset();
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
  expect(onSaved).not.toHaveBeenCalled();
});

it('closes the panel after a save, and leaves the Pins to the save itself', () => {
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));
  fireEvent.click(screen.getByRole('button', { name: 'Saved form' }));

  expect(slot('panel').textContent).toBe('');
  expect(onSaved).not.toHaveBeenCalled();
});

it('saves with createPinAction, gives back its answer, and calls onSaved for a saved Pin', async () => {
  vi.mocked(createPinAction).mockResolvedValue({ ok: true } as never);
  render(<Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a pin' }));

  const result = await form.mock.calls[0][0].onSave({ id: 'p' });

  expect(createPinAction).toHaveBeenCalledWith({ id: 'p' });
  expect(result).toEqual({ ok: true });
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it('calls onSaved for a save that finishes after the panel closed, and not for a failed save', async () => {
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
  finish({ ok: true } as never);
  await pending;
  expect(onSaved).toHaveBeenCalledTimes(1);

  await form.mock.calls[0][0].onSave({});
  expect(onSaved).toHaveBeenCalledTimes(1);
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
