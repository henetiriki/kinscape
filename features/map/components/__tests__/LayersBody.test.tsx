import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { Layer } from '@ks/features/map/types';

import { testLayer } from '@ks/features/map/__tests__/test-layer';
import { LayersBody } from '@ks/features/map/components/LayersBody';
import { pinsLayer } from '@ks/features/map/layers/pins';
import { polityLayer } from '@ks/features/map/layers/polities';
import { asDay } from '@ks/lib/domain/boundaries/model.mts';

const day = asDay(5);
const layers = [polityLayer, pinsLayer([])];

const renderBody = (props: Partial<Parameters<typeof LayersBody>[0]> = {}) =>
  render(
    <LayersBody
      day={day}
      layers={layers}
      onChange={vi.fn()}
      visible={{}}
      {...props}
    />
  );

const headings = () =>
  screen
    .getAllByRole('heading', { level: 3 })
    .map(heading => heading.textContent);

// MAP-05
it('draws the group Boundaries with "Polities", then the group Pins with "Pins"', () => {
  renderBody();

  expect(headings()).toEqual(['Boundaries', 'Pins']);
  within(screen.getByRole('group', { name: 'Boundaries' })).getByRole(
    'checkbox',
    { name: 'Polities' }
  );
  within(screen.getByRole('group', { name: 'Pins' })).getByRole('checkbox', {
    name: 'Pins',
  });
  expect(screen.getAllByRole('checkbox')).toHaveLength(2);
});

// MAP-05
it('puts the groups in the order of the panel, not the order of the layers', () => {
  renderBody({ layers: [pinsLayer([]), polityLayer] });

  expect(headings()).toEqual(['Boundaries', 'Pins']);
});

it('leaves out a group that holds no layer', () => {
  renderBody({ layers: [polityLayer] });

  screen.getByRole('group', { name: 'Boundaries' });
  expect(screen.queryByRole('group', { name: 'Pins' })).toBeNull();
});

it('draws each row checked unless its layer is off', () => {
  renderBody({ visible: { pins: false } });

  expect(
    (screen.getByRole('checkbox', { name: 'Polities' }) as HTMLInputElement)
      .checked
  ).toBe(true);
  expect(
    (screen.getByRole('checkbox', { name: 'Pins' }) as HTMLInputElement).checked
  ).toBe(false);
});

it('reports the layer and the new state when its row is clicked', () => {
  const onChange = vi.fn();

  renderBody({ onChange });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Polities' }));
  expect(onChange).toHaveBeenCalledWith('polity-borders', false);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Pins' }));
  expect(onChange).toHaveBeenCalledWith('pins', false);
});

it('describes the row with the text of its layer', () => {
  renderBody();

  screen.getByRole('checkbox', {
    description: 'Fills, borders and names of the Polities on the Map date.',
    name: 'Polities',
  });
});

// PIN-03
it('describes a row with the text a layer gives for the Map date, and again when the date moves', () => {
  const counted: Layer = {
    ...testLayer,
    description: mapDay => `Day ${mapDay} is on the map`,
  };
  const { rerender } = renderBody({ layers: [counted] });

  screen.getByRole('checkbox', {
    description: 'Day 5 is on the map',
    name: 'Test layer',
  });
  rerender(
    <LayersBody
      day={asDay(9)}
      layers={[counted]}
      onChange={vi.fn()}
      visible={{}}
    />
  );
  screen.getByRole('checkbox', {
    description: 'Day 9 is on the map',
    name: 'Test layer',
  });
});
