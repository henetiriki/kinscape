import type { CSSProperties, ReactNode } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';
import type { FanPin } from '@ks/features/map/types';

import { fanRings, fanSpots } from '@ks/lib/domain/map/fan.mts';
import { EventGlyph, eventLabel } from '@ks/lib/ui/EventGlyph';

import styles from '@ks/features/map/components/PinFan.module.css';

/** Half the 44px target of a fan Pin: the clear disc reaches this far past the outer ring. */
const HALF_TARGET = 22;

/** The name of a fan Pin: its event type and the reading of its date, as "Birth, about 1850". */
export const fanPinName = ({ event, reading }: Omit<FanPin, 'id'>) =>
  `${eventLabel(event)}, ${reading[0].toLowerCase()}${reading.slice(1)}`;

/**
 * The Pins of one Place, spread around it (PIN-06). Each Pin is a 44px target with its Event glyph.
 * Lines join the Pins of ring 1 to the Place; a fan of more than one ring also draws each ring.
 * A clear disc out past the outer ring keeps the fan open while the pointer crosses the gaps.
 * `children` is the count marker at the Place. `looks` shows a look on a Pin, for the boards.
 */
export const PinFan = ({
  children,
  looks,
  onOpen,
  pins,
}: {
  children?: ReactNode;
  looks?: Partial<Record<string, ControlState>>;
  /** A click on a Pin, with its id. */
  onOpen?: (id: string) => void;
  pins: FanPin[];
}) => {
  const rings = fanRings(pins.length);
  const spots = fanSpots(pins.length);
  const reach = rings.at(-1)!.radius + HALF_TARGET;

  return (
    <div
      className={styles.fan}
      style={{ '--reach': `${reach}px` } as CSSProperties}>
      <span aria-hidden='true' className={styles.reach} />
      <svg
        aria-hidden='true'
        className={styles.lines}
        viewBox={`${-reach} ${-reach} ${reach * 2} ${reach * 2}`}>
        {rings.length > 1 &&
          rings.map(({ radius }) => (
            <circle className={styles.ring} key={radius} r={radius} />
          ))}
        {spots
          .filter(({ ring }) => ring === 0)
          .map(({ x, y }) => (
            <line className={styles.line} key={`${x},${y}`} x2={x} y2={y} />
          ))}
      </svg>
      {children && <div className={styles.place}>{children}</div>}
      {pins.map((pin, index) => (
        <button
          aria-label={fanPinName(pin)}
          className={styles.pin}
          data-state={looks?.[pin.id]}
          key={pin.id}
          onClick={() => onOpen?.(pin.id)}
          style={{ left: spots[index].x, top: spots[index].y }}
          type='button'>
          <span className={styles.disc}>
            <EventGlyph event={pin.event} />
          </span>
        </button>
      ))}
    </div>
  );
};
