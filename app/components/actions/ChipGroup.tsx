import type { ChipOption } from '@ks/app/components/actions/types';

import { Chip } from '@ks/app/components/actions/Chip';

import styles from '@ks/app/components/actions/ChipGroup.module.css';

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
