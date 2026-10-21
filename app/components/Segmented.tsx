'use client';

import type { ControlState } from './controls';

export type Segment = { label: string; state?: ControlState; value: string };

/** One choice from a few, as radios: the arrow keys move the choice. */
export const Segmented = ({
  disabled,
  label,
  name,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: Segment[];
  value: string;
}) => (
  <div aria-label={label} className='seg' role='radiogroup'>
    {options.map(option => (
      <label className='seg-item' data-state={option.state} key={option.value}>
        <input
          checked={option.value === value}
          disabled={disabled}
          name={name}
          onChange={() => onChange?.(option.value)}
          type='radio'
          value={option.value}
        />
        {option.label}
      </label>
    ))}
  </div>
);
