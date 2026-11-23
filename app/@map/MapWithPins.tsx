'use client';

import type { ComponentProps } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { FixedPlace } from '@ks/features/people';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { useAddPin } from '@ks/app/@map/useAddPin';
import { Toast } from '@ks/app/components/feedback/Toast';
import { usePhone } from '@ks/app/components/foundation/usePhone';
import { PinPopup, PlacedPinPopup } from '@ks/app/components/overlays/PinPopup';
import { MapShell, pinsLayer, polityLayer } from '@ks/features/map';
import { usePinDetails, usePins } from '@ks/features/pins';
import { readFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date-text.mts';
import { formatFuzzyDate } from '@ks/lib/domain/dates/fuzzy-date.mts';

/**
 * The popup of the open Pin. It asks for the details when it mounts, so the popup sends no
 * request before a click. The loading and failed states show the event type and both date lines
 * from the Pin of the map.
 */
const OpenPinPopup = ({
  onAddHere,
  onClose,
  onEdit,
  pin,
  place,
}: {
  /** Opens the panel at the Place of the Pin, with the precision from its details. */
  onAddHere?: (place: FixedPlace) => void;
  onClose: () => void;
  /** Opens the edit panel for the Pin. */
  onEdit?: (id: MapPin['id']) => void;
  pin: MapPin;
  /** The point of the Pin on a desktop; none on a phone, where the popup sits in the date sheet. */
  place?: { x: number; y: number };
}) => {
  const { data, isError, isFetching, refetch } = usePinDetails(pin.id);
  const shared = {
    address: data?.address,
    event: pin.eventType,
    name: data && `${data.givenNames} ${data.surname}`.trim(),
    onAddHere:
      data && onAddHere
        ? () => {
            onAddHere({
              id: pin.placeId,
              latitude: pin.latitude,
              longitude: pin.longitude,
              precision: data.precision,
            });
            onClose();
          }
        : undefined,
    onClose,
    onEdit: onEdit
      ? () => {
          onEdit(pin.id);
          onClose();
        }
      : undefined,
    onRetry: () => void refetch(),
    reading: readFuzzyDate(pin),
    recorded: formatFuzzyDate(pin),
    state: data
      ? ('loaded' as const)
      : isError && !isFetching
        ? ('failed' as const)
        : ('loading' as const),
  };

  return place ? (
    <PlacedPinPopup {...shared} {...place} />
  ) : (
    <PinPopup {...shared} form='inline' />
  );
};

/** The `pin` prop of the shell for the open Pin. */
const pinProp = (
  open: MapPin,
  close: () => void,
  { addHere, edit }: Pick<ReturnType<typeof useAddPin>, 'addHere' | 'edit'>
): NonNullable<ComponentProps<typeof MapShell>['pin']> => ({
  open: { id: open.id, position: [open.longitude, open.latitude] },
  popup: (form, place) => (
    <OpenPinPopup
      key={open.id}
      onAddHere={addHere}
      onClose={close}
      onEdit={edit}
      pin={open}
      place={form === 'floating' ? place : undefined}
    />
  ),
  span: open.span,
});

/**
 * The map with its Pins. The Pins load once; a failed load shows an error toast with "Try again".
 * Until the Pins load, the layer holds none, so the "Pins" row reads "0 of 0". A click on a Pin
 * opens its popup (PIN-02).
 */
export const MapWithPins = (
  props: Omit<
    ComponentProps<typeof MapShell>,
    | 'action'
    | 'click'
    | 'layers'
    | 'onClosePin'
    | 'onEmptyClick'
    | 'onOpenPin'
    | 'panel'
    | 'pin'
    | 'toast'
  >
) => {
  const { data, errorUpdatedAt, isError, refetch } = usePins();
  const phone = usePhone();
  const queryClient = useQueryClient();
  // A save of an edit marks each held query of the Pins as stale, the details of the popup too.
  const add = useAddPin({
    onEdited: () => void queryClient.invalidateQueries({ queryKey: ['pins'] }),
    onSaved: () => void refetch(),
  });
  // The toast of one failure stays hidden once dismissed; a new failure has a new time.
  const [dismissedAt, setDismissedAt] = useState(0);
  const [openId, setOpenId] = useState<string>();
  const layers = useMemo(() => [polityLayer, pinsLayer(data ?? [])], [data]);
  const close = useCallback(() => setOpenId(undefined), []);
  const open = data?.find(({ id }) => id === openId);

  return (
    <MapShell
      {...props}
      action={add.action}
      click={add.click}
      layers={layers}
      onClosePin={close}
      onEmptyClick={add.onEmptyClick}
      onOpenPin={id => {
        setOpenId(id);
        add.closeClick?.();
      }}
      panel={add.panel}
      pin={open && pinProp(open, close, add)}
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
