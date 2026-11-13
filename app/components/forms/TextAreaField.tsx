import type { ComponentProps, ReactNode } from 'react';

import { useId } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/app/components/forms/TextAreaField.module.css';

/** A multi-line field with its label and helper text. It resizes up and down only; long content scrolls inside it. */
export const TextAreaField = ({
  helper,
  label,
  state,
  ...rest
}: {
  helper?: ReactNode;
  label: string;
  state?: ControlState;
} & Omit<ComponentProps<'textarea'>, 'className' | 'id'>) => {
  const id = useId();
  const helperId = `${id}-helper`;
  const describedBy = [rest['aria-describedby'], helper ? helperId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={id} variant='label'>
        {label}
      </Text>
      <span className={styles.box} data-state={state}>
        <textarea
          className={styles.area}
          rows={4}
          {...rest}
          aria-describedby={describedBy || undefined}
          id={id}
        />
      </span>
      {helper && (
        <Text id={helperId} variant='small'>
          {helper}
        </Text>
      )}
    </div>
  );
};
