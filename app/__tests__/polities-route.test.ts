import { expect, it } from 'vitest';

import { dynamic, GET } from '@ks/app/data/polities/route';
import { loadAppData } from '@ks/lib/boundaries/app-data';
import { isCurrentOn, toDay } from '@ks/lib/boundaries/model.mts';

type Feature = {
  properties: {
    kind: string;
    name: string;
    polity: string;
    validFrom: number;
    validTo: null | number;
  };
};

const UNION_ONLY = [
  'cape-of-good-hope',
  'natal',
  'orange-free-state',
  'transvaal',
];

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
  const ids = loadAppData()
    .polities.map(row => row.id)
    .filter(id => !UNION_ONLY.includes(id));

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
it('draws no Polity before 1910-05-31', async () => {
  expect(await featuresOn('boundary', '1910-05-30')).toHaveLength(0);
  expect(await featuresOn('label', '1910-05-30')).toHaveLength(0);
  expect(await featuresOn('boundary', '1910-05-31')).toHaveLength(6);
  expect(await namesOn('1910-05-31')).toEqual([
    'Basutoland',
    'Cape of Good Hope',
    'Natal',
    'Orange Free State',
    'Swaziland',
    'Transvaal',
  ]);
});

// MAP-06, BND-02
it('draws the four Union provinces with Basutoland and Swaziland in 1950', async () => {
  expect(await namesOn('1950-01-01')).toEqual([
    'Basutoland',
    'Cape of Good Hope',
    'Natal',
    'Orange Free State',
    'Swaziland',
    'Transvaal',
  ]);
  expect(await featuresOn('boundary', '1950-01-01')).toHaveLength(6);
});

// MAP-06
it('calls it Basutoland until 1966-10-03 and Lesotho from 1966-10-04', async () => {
  expect(await namesOn('1966-10-03')).toContain('Basutoland');
  expect(await namesOn('1966-10-03')).not.toContain('Lesotho');
  expect(await namesOn('1966-10-04')).toContain('Lesotho');
  expect(await namesOn('1970-01-01')).toContain('Lesotho');
  expect(await namesOn('1970-01-01')).not.toContain('Basutoland');
});

// MAP-06, BND-02
it('gives way to the 1994 provinces on 1994-04-27 with no gap or overlap', async () => {
  expect(await featuresOn('boundary', '1994-04-26')).toHaveLength(6);
  expect(await namesOn('1994-04-26')).toEqual([
    'Cape of Good Hope',
    'Lesotho',
    'Natal',
    'Orange Free State',
    'Swaziland',
    'Transvaal',
  ]);
  expect(await featuresOn('boundary', '1994-04-27')).toHaveLength(11);
  expect(await featuresOn('label', '1994-04-27')).toHaveLength(11);
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
    expect(properties.validFrom).toBeGreaterThanOrEqual(toDay('1910-05-31'));
    expect(properties.validTo ?? Infinity).toBeGreaterThan(
      properties.validFrom
    );
  }
});
