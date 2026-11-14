import type {
  PersonDates,
  SpouseDates,
} from '@ks/app/components/actions/types';

/** The note under a name: "née {maiden}", then the matched spelling, joined by " · ". */
export const personNote = (
  maidenName?: string,
  matchedVariant?: string
): string =>
  [
    maidenName && `née ${maidenName}`,
    matchedVariant && `Matches the spelling “${matchedVariant}”`,
  ]
    .filter(Boolean)
    .join(' · ');

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** The line: "1889 –", "? – 1932" or "1889 – ?". A living Person with no death date has no end. */
export const dateLine = ({
  born,
  deceased,
  died,
}: Pick<PersonDates, 'born' | 'deceased' | 'died'>): string =>
  `${born || '?'} –${died || deceased ? ` ${died || '?'}` : ''}`;

/** The line in words, for a screen reader: "Born in 1889, died unknown". */
export const dateWords = ({
  bornReading,
  deceased,
  diedReading,
}: PersonDates): string => {
  const born = `Born ${bornReading ? lower(bornReading) : 'unknown'}`;

  if (diedReading) return `${born}, died ${lower(diedReading)}`;

  return deceased ? `${born}, died unknown` : born;
};

/** "m. 1875 – div. 1890", "m. 1875", "div. 1890", or the empty string. */
export const spouseLine = ({ divorced, married }: SpouseDates): string =>
  [married && `m. ${married}`, divorced && `div. ${divorced}`]
    .filter(Boolean)
    .join(' – ');

/** The spouse dates in words, for a screen reader: "Mar. about 1875, div. in 1890". */
export const spouseWords = ({
  divorcedReading,
  marriedReading,
}: SpouseDates): string =>
  [
    marriedReading && `Mar. ${lower(marriedReading)}`,
    divorcedReading &&
      `${marriedReading ? 'div.' : 'Div.'} ${lower(divorcedReading)}`,
  ]
    .filter(Boolean)
    .join(', ');
