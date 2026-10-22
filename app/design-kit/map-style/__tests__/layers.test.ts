import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

import { LAYERS } from '../layers';

// NFR-06
it('lists the 20 layers in board order with unique ids', () => {
  expect(LAYERS.map(layer => layer.id)).toEqual([
    'background',
    'land',
    'polity-fill',
    'polity-contested',
    'hillshade',
    'coastline',
    'rivers',
    'district-line',
    'polity-line',
    'polity-line-approx',
    'boundary-changed',
    'water-label',
    'river-label',
    'polity-label',
    'place-dot',
    'place-label',
    'pin-halo',
    'pins',
    'pin-cluster',
    'selection',
  ]);
});

// NFR-06
it('covers only requirement IDs that exist', () => {
  const requirements = readFileSync(
    join(process.cwd(), 'docs/requirements.md'),
    'utf8'
  );

  for (const id of new Set(LAYERS.flatMap(layer => layer.covers))) {
    expect(requirements, id).toContain(id);
  }
});

// NFR-06, Spec D1 A
it('reads the river widths from the tokens', () => {
  expect(LAYERS.find(layer => layer.id === 'rivers')!.properties).toContain(
    'interpolate zoom 3→1, 8→3'
  );
});
