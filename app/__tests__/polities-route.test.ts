import { expect, it } from 'vitest';

import { loadAppData } from '@/lib/boundaries/app-data';

import { dynamic, GET } from '../data/polities/route';

it('is built once at deploy time', () => {
  expect(dynamic).toBe('force-static');
});

// MAP-01, MAP-05, BND-01
it('serves the 11 Polities and their names, and no other country', async () => {
  const { features } = await GET().json();
  const ids = loadAppData().polities.map(row => row.id);
  const byKind = (kind: string) =>
    features.filter(
      (feature: { properties: { kind: string } }) =>
        feature.properties.kind === kind
    );

  expect(byKind('boundary')).toHaveLength(11);
  expect(
    byKind('boundary')
      .map((f: { properties: { polity: string } }) => f.properties.polity)
      .toSorted()
  ).toEqual(ids.toSorted());
  expect(
    byKind('label')
      .map((f: { properties: { name: string } }) => f.properties.name)
      .toSorted()
  ).toEqual([
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Lesotho',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape',
    'eSwatini',
  ]);
});

// MAP-06
it('dates every feature so the Map date filter can apply', async () => {
  const { features } = await GET().json();

  for (const { properties } of features) {
    expect(properties.validFrom).toBe(130_484);
    expect(properties.validTo).toBeNull();
  }
});
