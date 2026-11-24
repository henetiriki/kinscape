'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { useCallback, useRef, useState } from 'react';

import type { ClickPoint } from '@ks/app/components/overlays/types';
import type { ClickProp } from '@ks/features/map';
import type { FixedPlace } from '@ks/features/people';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { createPinAction, updatePinAction } from '@ks/app/@map/actions';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { ClickPopup } from '@ks/app/components/overlays/ClickPopup';
import { useDismiss } from '@ks/app/components/overlays/useDismiss';
import { AddPinButton } from '@ks/features/map';
import { PinForm } from '@ks/features/people';
import { usePinEdit, useWritePin } from '@ks/features/pins';

/**
 * The flow: closed, the click popup at a point, the add panel with an optional point or an
 * existing Place, or the edit panel of a Pin. `again` counts each panel that opens, so each one
 * gets a new key. A save that ends late closes only the panel with its own `again`.
 */
type Flow =
  | { again: number; id: PinId; kind: 'edit' }
  | { again: number; kind: 'panel'; place?: FixedPlace; point?: ClickPoint }
  | { kind: 'click'; point: ClickPoint }
  | { kind: 'closed' };

type PinId = MapPin['id'];

const CLOSED: Flow = { kind: 'closed' };

type Result = {
  action?: ReactNode;
  /** Opens the panel at an existing Place, with empty fields, and closes the click popup. */
  addHere?: (place: FixedPlace) => void;
  /** The click popup, for the `click` prop of `MapShell`. */
  click?: ClickProp;
  /** Closes the click popup, and leaves an open panel alone. */
  closeClick?: () => void;
  /** Opens the edit panel for a Pin, and replaces any open panel or click popup. */
  edit?: (id: PinId) => void;
  /**
   * A click on empty map: opens the click popup, or sets the point of an open panel. A panel at an
   * existing Place keeps its Place, and an edit panel keeps its fields; neither opens a popup.
   */
  onEmptyClick?: (point: ClickPoint) => void;
  panel?: ReactNode;
};

/**
 * The save of both flows. An ok answer writes its `MapPin` to the cached Pins. It does not depend
 * on the open panel, so a save that ends after Cancel or Esc still writes.
 */
const useSave = (action: typeof createPinAction | typeof updatePinAction) => {
  const write = useWritePin();

  return useCallback(
    async (input: unknown) => {
      const result = await action(input);

      if (result.ok) write(result.value);

      return result;
    },
    [action, write]
  );
};

const clickPopup = (
  point: ClickPoint,
  open: (point: ClickPoint) => void,
  close: () => void
): ClickProp => ({
  popup: ({ x, y }) => (
    <ClickPopup onAdd={open} onClose={close} point={point} x={x} y={y} />
  ),
  position: [point.longitude, point.latitude],
});

/** The edit panel. It asks for the fields of the Pin when it mounts, so a closed panel sends no request. */
const EditPanel = ({
  id,
  onCancel,
  onSave,
  onSaved,
}: {
  id: PinId;
  onCancel: () => void;
  onSave: (input: unknown) => Promise<{ ok: boolean }>;
  onSaved: () => void;
}) => {
  const query = usePinEdit(id);

  return (
    <PinForm
      edit={{ id, query }}
      onCancel={onCancel}
      onSave={onSave}
      onSaved={onSaved}
    />
  );
};

// The setters of the flow. Each one that opens a panel counts in `again` (see `Flow`).
const useFlowActions = (setFlow: Dispatch<SetStateAction<Flow>>) => {
  const again = useRef(0);

  return {
    addHere: useCallback(
      (place: FixedPlace) => {
        again.current += 1;
        setFlow({ again: again.current, kind: 'panel', place });
      },
      [setFlow]
    ),
    close: useCallback(() => setFlow(CLOSED), [setFlow]),
    closeClick: useCallback(
      () => setFlow(current => (current.kind === 'click' ? CLOSED : current)),
      [setFlow]
    ),
    closeOwn: useCallback(
      (own: number) =>
        setFlow(current =>
          current.kind !== 'click' &&
          current.kind !== 'closed' &&
          current.again === own
            ? CLOSED
            : current
        ),
      [setFlow]
    ),
    edit: useCallback(
      (id: PinId) => {
        again.current += 1;
        setFlow({ again: again.current, id, kind: 'edit' });
      },
      [setFlow]
    ),
    onEmptyClick: useCallback(
      (point: ClickPoint) =>
        setFlow(current =>
          current.kind === 'edit'
            ? current
            : current.kind === 'panel'
              ? current.place
                ? current
                : { ...current, point }
              : { kind: 'click', point }
        ),
      [setFlow]
    ),
    openPanel: useCallback(
      (point?: ClickPoint) => {
        again.current += 1;
        setFlow({ again: again.current, kind: 'panel', point });
      },
      [setFlow]
    ),
  };
};

/** The panel of an open flow: the add form or the edit form. */
const panelOf = (
  flow: Flow,
  close: () => void,
  closeOwn: (own: number) => void,
  save: (input: unknown) => Promise<{ ok: boolean }>,
  saveEdit: (input: unknown) => Promise<{ ok: boolean }>
) =>
  flow.kind === 'panel' ? (
    <PinForm
      key={flow.again}
      onCancel={close}
      onSave={save}
      onSaved={() => closeOwn(flow.again)}
      place={flow.place}
      point={flow.point}
    />
  ) : flow.kind === 'edit' ? (
    <EditPanel
      id={flow.id}
      key={`edit-${flow.again}`}
      onCancel={close}
      onSave={saveEdit}
      onSaved={() => closeOwn(flow.again)}
    />
  ) : undefined;

/**
 * The state of the add and edit flows (PIN-01, PIN-02, NFR-05). On a desktop it gives the button
 * while no panel is open. It gives the panel while one is open, and the click popup after a click
 * on empty map. One panel slot holds one form: a new `addHere` or `edit` replaces the open form and drops its
 * typed values. A click on empty map with the add panel open sets its point and opens no popup. A
 * click with the edit panel open changes nothing. A phone gets none of these. A saved Pin closes the
 * panel and goes into the cached Pins, which then load again (`useWritePin`). A save that ends
 * after Cancel or Esc closed the panel also writes, because the server saved the Pin.
 */
export const useAddPin = (): Result => {
  const phone = usePhone();
  const [flow, setFlow] = useState<Flow>(CLOSED);
  const {
    addHere,
    close,
    closeClick,
    closeOwn,
    edit,
    onEmptyClick,
    openPanel,
  } = useFlowActions(setFlow);
  const save = useSave(createPinAction);
  const saveEdit = useSave(updatePinAction);

  // Esc closes the popup when nothing else owns it; Esc inside the popup closes it too.
  useDismiss(flow.kind === 'click', close, { escape: true });

  if (phone) {
    // A phone shows none of the flow, so it drops the state. A later desktop width starts closed.
    if (flow.kind !== 'closed') setFlow(CLOSED);

    return {};
  }

  return {
    action:
      flow.kind === 'panel' || flow.kind === 'edit' ? undefined : (
        <AddPinButton onClick={() => openPanel()} />
      ),
    addHere,
    click:
      flow.kind === 'click'
        ? clickPopup(flow.point, openPanel, close)
        : undefined,
    closeClick,
    edit,
    onEmptyClick,
    panel: panelOf(flow, close, closeOwn, save, saveEdit),
  };
};
