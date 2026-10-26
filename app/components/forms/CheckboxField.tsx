import type { ComponentProps, ReactNode } from 'react';

import { useId } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { Checkbox } from '@/app/components/forms/Checkbox';

import styles from './CheckboxField.module.css';

/** A checkbox with its label and, under it, an optional description the checkbox points to. */
export const CheckboxField = ({
  description,
  label,
  plain,
  size,
  state,
  ...rest
}: {
  /** Plain text under the label. It is not a live region. */
  description?: ReactNode;
  label: ReactNode;
  /** The sign-in form: a 15 / 22 label in ink-2 and no description. */
  plain?: boolean;
  /** `m` is a 44 row (Basemap and Pins); the default is 48 (Boundaries). */
  size?: 'm';
  state?: ControlState;
} & Omit<
  ComponentProps<'input'>,
  'aria-describedby' | 'className' | 'id' | 'size' | 'type'
>) => {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div
      className={styles.row}
      data-disabled={rest.disabled || undefined}
      data-plain={plain || undefined}
      data-size={size}>
      <Checkbox
        {...rest}
        aria-describedby={description ? descriptionId : undefined}
        id={id}
        state={state}
      />
      <span className={styles.text}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {description && (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </div>
  );
};
