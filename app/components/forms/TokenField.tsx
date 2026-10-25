'use client';

import { type ReactNode, useId, useRef, useState } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import { RemovableChip } from '@/app/components/actions/Chip';
import { Text } from '@/app/components/foundation/Text';
import styles from './TextField.module.css';

/** A field of removable chips with an input that adds the next one on Enter. */
export const TokenField = ({
  defaultValues = [],
  disabled,
  helper,
  label,
  onChange,
  placeholder,
  state,
  values: controlled,
}: {
  defaultValues?: string[];
  disabled?: boolean;
  helper?: ReactNode;
  label: string;
  onChange?: (values: string[]) => void;
  placeholder?: string;
  state?: ControlState;
  /** When given, the field shows these and only reports changes; the caller holds them. */
  values?: string[];
}) => {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [own, setValues] = useState(defaultValues);
  const values = controlled ?? own;
  const helperId = `${id}-helper`;

  const change = (next: string[]) => {
    setValues(next);
    onChange?.(next);
  };

  const add = () => {
    const text = input.current!.value.trim();

    input.current!.value = '';
    if (text && !values.some(v => v.toLowerCase() === text.toLowerCase()))
      change([...values, text]);
  };

  return (
    <div className={styles.field}>
      <Text as='label' htmlFor={id} variant='label'>
        {label}
      </Text>
      <span
        className={`${styles.box} ${styles.tokens}`}
        data-state={state}
        role='group'>
        {values.map(value => (
          <RemovableChip
            disabled={disabled}
            key={value}
            onRemove={() => {
              change(values.filter(v => v !== value));
              input.current!.focus();
            }}
            value={value}
          />
        ))}
        <input
          aria-describedby={helper ? helperId : undefined}
          className={styles.input}
          disabled={disabled}
          id={id}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            } else if (
              event.key === 'Backspace' &&
              !event.currentTarget.value &&
              values.length
            )
              change(values.slice(0, -1));
          }}
          placeholder={placeholder}
          ref={input}
          type='text'
        />
      </span>
      {helper && (
        <span className={styles.panelHelper} id={helperId}>
          {helper}
        </span>
      )}
    </div>
  );
};
