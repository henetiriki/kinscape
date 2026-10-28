import { z } from 'zod';

import { fromDay, toDay } from './model.mts';

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return (
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    fromDay(toDay(value)) === value
  );
};

const text = z.string().min(1);

const day = z.number().int();

const isoDate = text.refine(isIsoDate);

export const polityRow = z.object({ id: text });

export const nameRow = z.object({
  name: text,
  polity: text,
  validFrom: day,
  validTo: day.nullable(),
});

export const sourceRow = z.object({
  attribution: text,
  author: text,
  dateChecked: isoDate,
  id: text,
  layer: text,
  licence: text,
  licenceLink: text,
  processing: text.optional(),
  title: text,
});
