import { describe, expect, it } from 'vitest';

import { parseCoordinates } from '@ks/lib/domain/places/coordinates.mts';

// PIN-02
describe('parseCoordinates', () => {
  it.each([
    ['-33.93, 18.42', -33.93, 18.42],
    ['  -33.93,18.42  ', -33.93, 18.42],
    ['+12, -3.5', 12, -3.5],
    ['90, 180', 90, 180],
  ])('reads "%s" as decimal degrees', (text, latitude, longitude) => {
    expect(parseCoordinates(text)).toEqual({
      ok: true,
      value: { latitude, longitude },
    });
  });

  it.each(['', '   '])('asks for text when it is blank', text => {
    expect(parseCoordinates(text)).toEqual({ error: 'required', ok: false });
  });

  it.each([
    `33°55'48"S, 18°25'12"E`,
    '33° 55′ 48″, 18° 25′',
    '-33.93°, 18.42°',
  ])('names degrees, minutes and seconds in "%s"', text => {
    expect(parseCoordinates(text)).toEqual({ error: 'dms', ok: false });
  });

  it.each(['Cape Town', '-33.93', '-33.93; 18.42', '1, 2, 3', '-33.93, east'])(
    'refuses "%s" as not decimal',
    text => {
      expect(parseCoordinates(text)).toEqual({
        error: 'not-decimal',
        ok: false,
      });
    }
  );

  it.each(['90.5, 18', '-91, 18', '-33, 181', '-33, -180.1'])(
    'refuses "%s" as out of range',
    text => {
      expect(parseCoordinates(text)).toEqual({
        error: 'out-of-range',
        ok: false,
      });
    }
  );
});
