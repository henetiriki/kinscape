import { z } from 'zod';

import { parsePlaceId } from '#ks/lib/domain/ids/ids.mts';
import { idField } from '#ks/lib/domain/ids/schemas.mts';

/**
 * The most Places a list returns. Each Pin may have its own Place, and the map checks 10,000 Pins,
 * so this matches `MAX_RELATIONSHIPS`.
 */
export const MAX_PLACES = 10_000;

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

/** The largest latitude and longitude in degrees, north or south and east or west of zero. */
export const MAX_LATITUDE = 90;
export const MAX_LONGITUDE = 180;

/** What a client may save for a Place (PIN-02). A map click gives no precision, so it defaults. */
export const placeInputSchema = z.strictObject({
  id: idField(parsePlaceId),
  latitude: z.number().min(-MAX_LATITUDE).max(MAX_LATITUDE),
  longitude: z.number().min(-MAX_LONGITUDE).max(MAX_LONGITUDE),
  precision: z.enum(PLACE_PRECISIONS).default('approximate'),
});
