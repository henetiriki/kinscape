'use client';

import type { ComponentProps } from 'react';

import { useMemo, useState } from 'react';

import { Toast } from '@ks/app/components/feedback/Toast';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { MapShell, pinsLayer, polityLayer } from '@ks/features/map';
import { usePins } from '@ks/features/pins';

/**
 * The map with its Pins. The Pins load once; a failed load shows an error toast with "Try again".
 * Until the Pins load, the layer holds none, so the "Pins" row reads "0 of 0".
 */
export const MapWithPins = (
  props: Omit<ComponentProps<typeof MapShell>, 'layers' | 'toast'>
) => {
  const { data, errorUpdatedAt, isError, refetch } = usePins();
  const phone = usePhone();
  // The toast of one failure stays hidden once dismissed; a new failure has a new time.
  const [dismissedAt, setDismissedAt] = useState(0);
  const layers = useMemo(() => [polityLayer, pinsLayer(data ?? [])], [data]);

  return (
    <MapShell
      {...props}
      layers={layers}
      toast={
        isError && errorUpdatedAt !== dismissedAt ? (
          <Toast
            action='Try again'
            onAction={() => void refetch()}
            onDismiss={() => setDismissedAt(errorUpdatedAt)}
            placed={phone}
            tone='error'>
            Your pins did not load.
          </Toast>
        ) : undefined
      }
    />
  );
};
