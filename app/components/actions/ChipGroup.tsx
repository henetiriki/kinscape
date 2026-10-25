import type { EventType } from '@/app/components/map/EventGlyph';

import { Chip } from '@/app/components/actions/Chip';
import styles from './ChipGroup.module.css';

export type ChipOption = {
  /** The Event type this chip filters on; its glyph leads the label. */
  glyph?: EventType;
  label: string;
  value: string;
};

/** A labelled set of toggle chips that wraps. */
export const ChipGroup = ({
  label,
  onToggle,
  options,
  selected,
}: {
  label: string;
  onToggle: (value: string) => void;
  options: ChipOption[];
  selected: string[];
}) => (
  <fieldset className={styles.group}>
    <legend className={styles.legend}>{label}</legend>
    <div className={styles.chips}>
      {options.map(({ glyph, label: text, value }) => (
        <Chip
          glyph={glyph}
          key={value}
          on={selected.includes(value)}
          onClick={() => onToggle(value)}>
          {text}
        </Chip>
      ))}
    </div>
  </fieldset>
);
