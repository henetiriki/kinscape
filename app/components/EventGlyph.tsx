import styles from './EventGlyph.module.css';

/** The character for each Event type (DESIGN.md › Event glyphs). */
export const EVENT_GLYPHS = {
  baptism: '○',
  birth: '●',
  burial: '▼',
  death: '✚',
  land: '□',
  marriage: '◆',
  occupation: '▲',
  other: '✱',
  residence: '■',
} as const;

export type EventType = keyof typeof EVENT_GLYPHS;

// U+FE0E asks for the text form, so ✚ and ✱ never draw as emoji.
const TEXT_FORM = '︎';

/** An Event type's glyph in `--pin`. Decorative: the Event's name sits beside it. */
export const EventGlyph = ({
  event,
  size = 14,
}: {
  event: EventType;
  size?: 12 | 13 | 14 | 16;
}) => (
  <span
    aria-hidden='true'
    className={styles.glyph}
    data-event={event}
    style={{ fontSize: size }}>
    {EVENT_GLYPHS[event] + TEXT_FORM}
  </span>
);
