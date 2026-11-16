import { z } from 'zod';

import { parsePlaceId } from '#ks/lib/domain/ids/ids.mts';
import { idField } from '#ks/lib/domain/ids/schemas.mts';

/** How exactly a Place is known (PIN-02): `street` is street address and `town` is town or city. */
export const PLACE_PRECISIONS = [
  'street',
  'building',
  'erf',
  'farm',
  'suburb',
  'town',
  'district',
  'province',
  'approximate',
] as const;

/** What a client may save for a Place (PIN-02). A map click gives no precision, so it defaults. */
export const placeInputSchema = z.strictObject({
  id: idField(parsePlaceId),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  precision: z.enum(PLACE_PRECISIONS).default('approximate'),
});
