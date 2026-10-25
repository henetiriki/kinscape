import { type ComponentProps, type ReactNode, useId } from 'react';

import { CheckboxField } from '@/app/components/forms/CheckboxField';
import styles from './LayerGroup.module.css';
import { Text } from '@/app/components/foundation/Text';

export type LayerRow = {
  checked: boolean;
  description?: ReactNode;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
  /** `m` is the 44 row Basemap and Pins draw; Boundaries draws 48. */
  size?: ComponentProps<typeof CheckboxField>['size'];
};

/** A heading and checkbox rows, named by the heading. */
export const LayerGroup = ({
  heading,
  rows,
}: {
  heading: string;
  rows: LayerRow[];
}) => {
  const id = useId();

  return (
    <div aria-labelledby={id} className={styles.group} role='group'>
      <Text as='h3' id={id} variant='overline'>
        {heading}
      </Text>
      {rows.map(({ id: key, onChange, ...row }) => (
        <CheckboxField
          key={key}
          {...row}
          onChange={event => onChange(event.target.checked)}
        />
      ))}
    </div>
  );
};
