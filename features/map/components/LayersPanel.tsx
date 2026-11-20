'use client';

import type { Layer, LayerId } from '@ks/features/map/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';

import { Checkbox } from '@ks/app/components/forms/Checkbox';
import { Text } from '@ks/app/components/foundation/Text';

import styles from '@ks/features/map/components/LayersPanel.module.css';

type ListProps = {
  /** The Map date, for a layer whose help text depends on it. */
  day: Day;
  layers: Layer[];
  onChange: (id: LayerId, show: boolean) => void;
  /** Each layer is on unless its entry is `false`. */
  visible: Partial<Record<LayerId, boolean>>;
};

/** One layer's row: its label, its help text and a toggle. */
const LayersRow = ({
  checked,
  day,
  layer: { description, id, label },
  onChange,
}: {
  checked: boolean;
  day: Day;
  layer: Layer;
  onChange: (show: boolean) => void;
}) => (
  <div className={styles.row}>
    <span className={styles.checkbox}>
      <Checkbox
        aria-describedby={`${id}-help`}
        checked={checked}
        id={id}
        onChange={event => onChange(event.target.checked)}
      />
    </span>
    <div className={styles.text}>
      <Text as='label' htmlFor={id} variant='label'>
        {label}
      </Text>
      <Text id={`${id}-help`} variant='small'>
        {typeof description === 'function' ? description(day) : description}
      </Text>
    </div>
  </div>
);

/** A row per layer: the panel's body on a desktop, the whole content of the Layers sheet on a phone. */
export const LayersList = ({ day, layers, onChange, visible }: ListProps) =>
  layers.map(layer => (
    <LayersRow
      checked={visible[layer.id] !== false}
      day={day}
      key={layer.id}
      layer={layer}
      onChange={show => onChange(layer.id, show)}
    />
  ));

export const LayersPanel = (props: ListProps) => (
  <aside aria-label='Layers' className={styles.panel}>
    <div className={styles.heading}>
      <Text as='h2' variant='overline'>
        Layers
      </Text>
    </div>
    <LayersList {...props} />
  </aside>
);
