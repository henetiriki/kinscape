import type { FanRing, FanSpot } from '#ks/lib/domain/map/types.ts';

/** Ring 1 of a fan: its radius and the Pins it holds (the Fan of Pins in `design/DESIGN.md`). */
const FIRST = { count: 7, radius: 56 };

/** Each next ring is this much larger. */
const STEP = 48;

/**
 * The rings of a fan of `count` Pins. The Pins fill the inner ring first. Each ring keeps the gap
 * between Pins of ring 1, so it holds 7 × its radius ÷ 56 Pins, rounded down (#863 plan D3).
 */
export const fanRings = (count: number): FanRing[] => {
  const rings: FanRing[] = [];

  for (let left = count, ring = 0; left > 0; ring += 1) {
    const radius = FIRST.radius + ring * STEP;
    const holds = Math.floor((FIRST.count * radius) / FIRST.radius);

    rings.push({ count: Math.min(holds, left), radius });
    left -= holds;
  }

  return rings;
};

/**
 * Where each of `count` Pins sits, in the order of the Pins. Each ring spaces its Pins evenly. The
 * first Pin of a ring sits below the Place, and the next go clockwise (#863 plan D4). The offsets
 * are whole px, as the boards draw them.
 */
export const fanSpots = (count: number): FanSpot[] =>
  fanRings(count).flatMap(({ count: onRing, radius }, ring) =>
    Array.from({ length: onRing }, (_, index) => {
      const angle = Math.PI / 2 + (2 * Math.PI * index) / onRing;

      // `+ 0` turns the -0 of a rounded small negative into 0.
      return {
        ring,
        x: Math.round(radius * Math.cos(angle)) + 0,
        y: Math.round(radius * Math.sin(angle)) + 0,
      };
    })
  );
