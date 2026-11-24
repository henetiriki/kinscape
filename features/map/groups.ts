import type { ComponentProps } from 'react';

import type { CheckboxField } from '@ks/app/components/forms/CheckboxField';
import type { LayerGroupId } from '@ks/features/map/types';

/** A group of the Layers panel: its heading and the row size of its layers. */
type PanelGroup = {
  heading: string;
  id: LayerGroupId;
  /** `m` is the 44 row that Pins draw; Boundaries draws 48, the default. */
  size?: ComponentProps<typeof CheckboxField>['size'];
};

/** The groups of the Layers panel, in the order the panel draws them. A group with no layer is left out. */
export const PANEL_GROUPS: PanelGroup[] = [
  { heading: 'Boundaries', id: 'boundaries' },
  { heading: 'Pins', id: 'pins', size: 'm' },
];
