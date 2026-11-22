'use client';

import type { ReactNode } from 'react';

import { useCallback, useState } from 'react';

import { createPinAction } from '@ks/app/@map/actions';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { AddPinButton } from '@ks/features/map';
import { PinForm } from '@ks/features/people';

/**
 * The open state of the "Add a pin" panel (PIN-01, NFR-05). On a desktop it gives the button while
 * the panel is closed and the panel while it is open. A phone gets neither. A saved Pin closes the
 * panel and calls `onSaved`, so the caller loads the Pins again. A save that ends after Cancel or
 * Esc closed the panel also calls `onSaved`, because the server has saved the Pin.
 */
export const useAddPin = ({
  onSaved,
}: {
  onSaved: () => void;
}): { action?: ReactNode; panel?: ReactNode } => {
  const phone = usePhone();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const save = useCallback(
    async (input: unknown) => {
      const result = await createPinAction(input);

      if (result.ok) onSaved();

      return result;
    },
    [onSaved]
  );

  if (phone) {
    return {};
  }

  return open
    ? {
        panel: <PinForm onCancel={close} onSave={save} onSaved={close} />,
      }
    : { action: <AddPinButton onClick={() => setOpen(true)} /> };
};
