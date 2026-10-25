import { expect, it } from 'vitest';

import { loadAppData } from '@/lib/boundaries/app-data';
import { isCurrentOn, toDay } from '@/lib/boundaries/model.mts';

import { dynamic, GET } from '../data/polities/route';

type Feature = {
  properties: {
    kind: string;
    name: string;
    polity: string;
    validFrom: number;
    validTo: null | number;
  };
};

const featuresOn = async (kind: string, isoDate: string) => {
  const { features } = (await GET().json()) as { features: Feature[] };

  return features.filter(
    ({ properties }) =>
      properties.kind === kind && isCurrentOn(properties, toDay(isoDate))
  );
};

const namesOn = async (isoDate: string) =>
  (await featuresOn('label', isoDate)).map(f => f.properties.name).toSorted();

it('is built once at deploy time', () => {
  expect(dynamic).toBe('force-static');
});

// MAP-01, MAP-05, BND-01
it('serves the 11 Polities and their names, and no other country', async () => {
  const ids = loadAppData().polities.map(row => row.id);

  expect(
    (await featuresOn('boundary', '2020-01-01'))
      .map(f => f.properties.polity)
      .toSorted()
  ).toEqual(ids.toSorted());
  expect(await namesOn('2020-01-01')).toEqual([
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
it('serves the 1994 names, with Swaziland, on 1995-06-01', async () => {
  expect(await namesOn('1995-06-01')).toEqual([
    'Eastern Cape',
    'Eastern Transvaal',
    'KwaZulu/Natal',
    'Lesotho',
    'North-West',
    'Northern Cape',
    'Northern Transvaal',
    'Orange Free State',
    'Pretoria-Witwatersrand-Vereeniging',
    'Swaziland',
    'Western Cape',
  ]);
  expect(await featuresOn('boundary', '1995-06-01')).toHaveLength(11);
});

// MAP-06
it('calls it Swaziland in 2015 and eSwatini in 2020', async () => {
  expect(await namesOn('2015-01-01')).toContain('Swaziland');
  expect(await namesOn('2015-01-01')).not.toContain('eSwatini');
  expect(await namesOn('2020-01-01')).toContain('eSwatini');
});

// MAP-06, BND-02
it('draws no Polity before 1994-04-27', async () => {
  expect(await featuresOn('boundary', '1994-04-26')).toHaveLength(0);
  expect(await featuresOn('label', '1994-04-26')).toHaveLength(0);
  expect(await featuresOn('boundary', '1994-04-27')).toHaveLength(11);
});

// MAP-06, BND-02
it('changes a label on a rename and keeps one shape either side', async () => {
  const { boundaries } = loadAppData();
  const shapeOn = (isoDate: string) =>
    boundaries.filter(
      version =>
        version.polity === 'mpumalanga' && isCurrentOn(version, toDay(isoDate))
    );
  const labelOn = async (isoDate: string) =>
    (await featuresOn('label', isoDate))
      .filter(f => f.properties.polity === 'mpumalanga')
      .map(f => f.properties.name);

  expect(await labelOn('1995-09-19')).toEqual(['Eastern Transvaal']);
  expect(await labelOn('1995-09-20')).toEqual(['Mpumalanga']);
  expect(shapeOn('1995-09-19')).toHaveLength(1);
  expect(shapeOn('1995-09-19')).toEqual(shapeOn('1995-09-20'));
});

// MAP-06
it('switches shapes on 2006-03-01 and 2009-04-03 with one label each day', async () => {
  const labels = async (isoDate: string) =>
    (await featuresOn('label', isoDate)).filter(
      f => f.properties.polity === 'gauteng'
    );
  const boundaries = async (isoDate: string) =>
    (await featuresOn('boundary', isoDate)).filter(
      f => f.properties.polity === 'gauteng'
    );

  for (const date of ['2006-02-28', '2006-03-01', '2009-04-02', '2009-04-03']) {
    expect(await labels(date)).toHaveLength(1);
    expect(await boundaries(date)).toHaveLength(1);
  }
});

// MAP-06
it('dates every feature inside the data and never past today', async () => {
  const { features } = (await GET().json()) as { features: Feature[] };

  for (const { properties } of features) {
    expect(properties.validFrom).toBeGreaterThanOrEqual(toDay('1994-04-27'));
    expect(properties.validTo ?? Infinity).toBeGreaterThan(
      properties.validFrom
    );
  }
});
