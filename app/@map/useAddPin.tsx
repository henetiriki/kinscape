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
 * panel and calls `onSaved`, so the caller loads the Pins again.
 */
export const useAddPin = ({
  onSaved,
}: {
  onSaved: () => void;
}): { action?: ReactNode; panel?: ReactNode } => {
  const phone = usePhone();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const saved = useCallback(() => {
    setOpen(false);
    onSaved();
  }, [onSaved]);

  if (phone) {
    return {};
  }

  return open
    ? {
        panel: (
          <PinForm onCancel={close} onSave={createPinAction} onSaved={saved} />
        ),
      }
    : { action: <AddPinButton onClick={() => setOpen(true)} /> };
};
