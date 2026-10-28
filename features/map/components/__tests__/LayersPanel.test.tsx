import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { testLayer } from '@ks/features/map/__tests__/test-layer';
import {
  LayersList,
  LayersPanel,
} from '@ks/features/map/components/LayersPanel';
import { polityLayer } from '@ks/features/map/layers/polities';

const layers = [polityLayer];

it('draws the rows alone for the phone Layers sheet', () => {
  render(
    <LayersList
      layers={layers}
      onChange={vi.fn()}
      visible={{ [polityLayer.id]: false }}
    />
  );

  expect(screen.queryByRole('heading')).toBeNull();
  expect(
    (
      screen.getByRole('checkbox', {
        name: /Polity borders/,
      }) as HTMLInputElement
    ).checked
  ).toBe(false);
});

it('shows the Polity borders row, checked when the layer is on', () => {
  render(<LayersPanel layers={layers} onChange={vi.fn()} visible={{}} />);

  expect(
    (
      screen.getByRole('checkbox', {
        name: /Polity borders/,
      }) as HTMLInputElement
    ).checked
  ).toBe(true);
});

it('names and describes the row from the layer, with the ids it has always had', () => {
  render(<LayersPanel layers={layers} onChange={vi.fn()} visible={{}} />);

  const box = screen.getByRole('checkbox', { name: 'Polity borders' });

  expect(box.id).toBe('polity-borders');
  expect(box.getAttribute('aria-describedby')).toBe('polity-borders-help');
  expect(
    screen.getByText(
      'Fills, borders and names of the Polities on the Map date.'
    ).id
  ).toBe('polity-borders-help');
});

it('reports the layer and the new state when its row is clicked', () => {
  const onChange = vi.fn();

  render(<LayersPanel layers={layers} onChange={onChange} visible={{}} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /Polity borders/ }));

  expect(onChange).toHaveBeenCalledWith('polity-borders', false);
});

it('draws one row per layer, each with its own toggle', () => {
  const onChange = vi.fn();

  render(
    <LayersPanel
      layers={[polityLayer, testLayer]}
      onChange={onChange}
      visible={{ [testLayer.id]: false }}
    />
  );

  expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  expect(
    (screen.getByRole('checkbox', { name: 'Test layer' }) as HTMLInputElement)
      .checked
  ).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Test layer' }));
  expect(onChange).toHaveBeenCalledWith('test-layer', true);
});
