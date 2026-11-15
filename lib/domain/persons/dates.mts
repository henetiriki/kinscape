import type { FuzzyDate } from '#ks/lib/domain/dates/types.ts';
import type { PersonSummary } from '#ks/lib/domain/persons/types.ts';

import {
  readFuzzyDate,
  shortFuzzyDate,
} from '#ks/lib/domain/dates/fuzzy-date-text.mts';

const short = (date?: FuzzyDate) => (date ? shortFuzzyDate(date) : '');
const reading = (date?: FuzzyDate) => (date ? readFuzzyDate(date) : '');

/** The dates of a Person as texts, for a page to send. An unknown date is the empty string. */
export const personDates = (person: {
  birth?: FuzzyDate;
  death?: FuzzyDate;
  deceased: boolean;
}): Pick<
  PersonSummary,
  'born' | 'bornReading' | 'deceased' | 'died' | 'diedReading'
> => ({
  born: short(person.birth),
  bornReading: reading(person.birth),
  deceased: person.deceased,
  died: short(person.death),
  diedReading: reading(person.death),
});

/** The marriage and divorce dates of a spouse link as texts. An unknown date is the empty string. */
export const spouseDates = (link: {
  divorce?: FuzzyDate;
  marriage?: FuzzyDate;
}) => ({
  divorced: short(link.divorce),
  divorcedReading: reading(link.divorce),
  married: short(link.marriage),
  marriedReading: reading(link.marriage),
});
