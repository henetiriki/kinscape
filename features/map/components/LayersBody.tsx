'use client';

import type { Layer, LayerId, LegendRow } from '@ks/features/map/types';
import type { Day } from '@ks/lib/domain/boundaries/types.ts';

import { LayerGroup } from '@ks/features/map/components/LayerGroup';
import { Legend } from '@ks/features/map/components/Legend';
import { PANEL_GROUPS } from '@ks/features/map/groups';

import styles from '@ks/features/map/components/LayersBody.module.css';

/** The legend rows for the marks the live map draws. BND-04 and EXP-02 add `contested` and `uncertain`. */
const DRAWN_ROWS: LegendRow[] = ['border', 'approximate', 'events'];

/**
 * What the Layers panel and the phone Layers sheet hold: a group of rows for each `PANEL_GROUPS`
 * entry that has a layer, then the legend. The body has no head: the panel brings its tab and
 * the sheet its title.
 */
export const LayersBody = ({
  day,
  layers,
  onChange,
  visible,
}: {
  /** The Map date, for a layer whose help text depends on it. */
  day: Day;
  layers: Layer[];
  onChange: (id: LayerId, show: boolean) => void;
  /** Each layer is on unless its entry is `false`. */
  visible: Partial<Record<LayerId, boolean>>;
}) => (
  <>
    {PANEL_GROUPS.map(({ heading, id, size }) => {
      const members = layers.filter(layer => layer.group === id);

      return members.length === 0 ? null : (
        <LayerGroup
          heading={heading}
          key={id}
          rows={members.map(layer => ({
            checked: visible[layer.id] !== false,
            description:
              typeof layer.description === 'function'
                ? layer.description(day)
                : layer.description,
            id: layer.id,
            label: layer.label,
            onChange: show => onChange(layer.id, show),
            size,
          }))}
        />
      );
    })}
    <div className={styles.legend}>
      <Legend rows={DRAWN_ROWS} />
    </div>
  </>
);
