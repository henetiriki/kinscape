'use client';

import type { ReactNode } from 'react';

import { useCallback, useRef, useState } from 'react';

import type { ClickPoint } from '@ks/app/components/overlays/types';
import type { ClickProp } from '@ks/features/map';
import type { FixedPlace } from '@ks/features/people';

import { createPinAction } from '@ks/app/@map/actions';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { ClickPopup } from '@ks/app/components/overlays/ClickPopup';
import { useDismiss } from '@ks/app/components/overlays/useDismiss';
import { AddPinButton } from '@ks/features/map';
import { PinForm } from '@ks/features/people';

/**
 * The add flow: closed, the click popup at a point, or the panel with an optional point or an
 * existing Place. `again` counts the "Add a pin here" choices, so each one gives the panel a new key.
 */
type Flow =
  | { again?: number; kind: 'panel'; place?: FixedPlace; point?: ClickPoint }
  | { kind: 'click'; point: ClickPoint }
  | { kind: 'closed' };

const CLOSED: Flow = { kind: 'closed' };

type Result = {
  action?: ReactNode;
  /** Opens the panel at an existing Place, with empty fields, and closes the click popup. */
  addHere?: (place: FixedPlace) => void;
  /** The click popup, for the `click` prop of `MapShell`. */
  click?: ClickProp;
  /** Closes the click popup, and leaves an open panel alone. */
  closeClick?: () => void;
  /**
   * A click on empty map: opens the click popup, or sets the point of an open panel. A panel at an
   * existing Place keeps its Place and opens no popup.
   */
  onEmptyClick?: (point: ClickPoint) => void;
  panel?: ReactNode;
};

const useSave = (onSaved: () => void) =>
  useCallback(
    async (input: unknown) => {
      const result = await createPinAction(input);

      if (result.ok) onSaved();

      return result;
    },
    [onSaved]
  );

const clickPopup = (
  point: ClickPoint,
  set: (flow: Flow) => void
): ClickProp => ({
  popup: ({ x, y }) => (
    <ClickPopup
      onAdd={added => set({ kind: 'panel', point: added })}
      onClose={() => set(CLOSED)}
      point={point}
      x={x}
      y={y}
    />
  ),
  position: [point.longitude, point.latitude],
});

/**
 * The state of the add flow (PIN-01, NFR-05). On a desktop it gives the button while the panel is
 * closed, the panel while it is open, and the click popup after a click on empty map. A click on
 * empty map with the panel open sets the point of the panel and opens no popup. A phone gets none
 * of these. A saved Pin closes the panel and calls `onSaved`, so the caller loads the Pins again. A
 * save that ends after Cancel or Esc closed the panel also calls `onSaved`, because the server has
 * saved the Pin.
 */
export const useAddPin = ({ onSaved }: { onSaved: () => void }): Result => {
  const phone = usePhone();
  const [flow, setFlow] = useState<Flow>(CLOSED);
  const close = useCallback(() => setFlow(CLOSED), []);
  const closeClick = useCallback(
    () => setFlow(current => (current.kind === 'click' ? CLOSED : current)),
    []
  );
  const onEmptyClick = useCallback(
    (point: ClickPoint) =>
      setFlow(current =>
        current.kind === 'panel'
          ? current.place
            ? current
            : { kind: 'panel', point }
          : { kind: 'click', point }
      ),
    []
  );
  const again = useRef(0);
  const addHere = useCallback((place: FixedPlace) => {
    again.current += 1;
    setFlow({ again: again.current, kind: 'panel', place });
  }, []);
  const save = useSave(onSaved);

  // Esc closes the popup when nothing else owns it; Esc inside the popup closes it too.
  useDismiss(flow.kind === 'click', close, { escape: true });

  if (phone) {
    // A phone shows none of the flow, so it drops the state. A later desktop width starts closed.
    if (flow.kind !== 'closed') setFlow(CLOSED);

    return {};
  }

  return {
    action:
      flow.kind === 'panel' ? undefined : (
        <AddPinButton onClick={() => setFlow({ kind: 'panel' })} />
      ),
    addHere,
    click: flow.kind === 'click' ? clickPopup(flow.point, setFlow) : undefined,
    closeClick,
    onEmptyClick,
    panel:
      flow.kind === 'panel' ? (
        <PinForm
          key={flow.again}
          onCancel={close}
          onSave={save}
          onSaved={close}
          place={flow.place}
          point={flow.point}
        />
      ) : undefined,
  };
};
