import type { CoordinateError } from '#ks/lib/domain/places/types.ts';
import type { Result } from '#ks/lib/domain/result/types.ts';

import { MAX_LATITUDE, MAX_LONGITUDE } from '#ks/lib/domain/places/schemas.mts';
import { err, ok } from '#ks/lib/domain/result/result.mts';

const DEGREE_MARKS = /[°′″'"]/;
const DECIMAL = /^[+-]?\d+(\.\d+)?$/;

/**
 * Reads "latitude, longitude" in decimal degrees (PIN-02), such as "-33.93, 18.42". Degree, minute
 * or second marks give `dms`, so the form can ask for decimal degrees. Any other text that is not
 * two decimal numbers gives `not-decimal`. A number outside its range gives `out-of-range`. An
 * error never holds the text.
 */
export const parseCoordinates = (
  text: string
): Result<{ latitude: number; longitude: number }, CoordinateError> => {
  if (text.trim() === '') {
    return err('required');
  }

  if (DEGREE_MARKS.test(text)) {
    return err('dms');
  }

  const parts = text.split(',').map(part => part.trim());

  if (parts.length !== 2 || !parts.every(part => DECIMAL.test(part))) {
    return err('not-decimal');
  }

  const [latitude, longitude] = parts.map(Number) as [number, number];

  return Math.abs(latitude) > MAX_LATITUDE ||
    Math.abs(longitude) > MAX_LONGITUDE
    ? err('out-of-range')
    : ok({ latitude, longitude });
};
