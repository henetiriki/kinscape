import { type ComponentProps, type ReactNode, useId } from 'react';

import type { ControlState } from './controls';

import { Checkbox } from './Checkbox';
import styles from './CheckboxField.module.css';

/** A checkbox with its label and, under it, an optional description the checkbox points to. */
export const CheckboxField = ({
  description,
  label,
  plain,
  state,
  ...rest
}: {
  /** Plain text under the label. It is not a live region. */
  description?: ReactNode;
  label: ReactNode;
  /** The sign-in form: a 15 / 22 label in ink-2 and no description. */
  plain?: boolean;
  state?: ControlState;
} & Omit<
  ComponentProps<'input'>,
  'aria-describedby' | 'className' | 'id' | 'type'
>) => {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div
      className={styles.row}
      data-disabled={rest.disabled || undefined}
      data-plain={plain || undefined}>
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
