import type { Metadata } from 'next';

import { TextLink } from '@ks/app/components/actions/TextLink';
import { boardTitle } from '@ks/app/design-kit/boards';
import {
  ActionBarSection,
  BackLinkSection,
  ButtonLinks,
  PageHeaderSection,
} from '@ks/app/design-kit/inputs/pageParts';
import {
  FuzzyDateFields,
  LongTextFields,
  PersonRows,
} from '@ks/app/design-kit/inputs/people';
import {
  Alerts,
  Buttons,
  CheckboxFields,
  Chips,
  Dividers,
  KeyHints,
  TabsSection,
  TextFields,
} from '@ks/app/design-kit/inputs/sections';
import { requireDevPage } from '@ks/server/auth/current.mts';

import kit from '@ks/app/design-kit/kit.module.css';

import styles from '@ks/app/design-kit/inputs/page.module.css';

export const metadata: Metadata = { title: boardTitle('inputs') };

const OTHER_PART = {
  1: {
    href: '/design-kit/inputs',
    text: 'Part 1: buttons, text fields, chips and button links',
  },
  2: {
    href: '/design-kit/inputs?part=2',
    text: 'Part 2: tabs, checkbox fields, alerts, dividers, key hints, page header, back link and action bar',
  },
} as const;

/**
 * Board 06. A desktop shows every section. A phone shows one of two parts: `?part=2` is part 2,
 * anything else part 1, and a link leads to the other.
 */
const InputsKit = async ({
  searchParams,
}: {
  searchParams: Promise<{ part?: string | string[] }>;
}) => {
  await requireDevPage();

  const part = (await searchParams).part === '2' ? 2 : 1;
  const other = OTHER_PART[part === 1 ? 2 : 1];

  return (
    <main className={styles.kit} data-part={part}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>
          Style guide · 06
          <span className={styles.partOf}> · part {part} of 2</span>
        </span>
        <h1 className={kit.kitTitle}>Inputs and actions</h1>
        <p className={kit.kitLead}>
          Every button, field, chip, tab and checkbox row the sign-in and map
          screens use, at the sizes they use them, with their states.
        </p>
        <p className={styles.note}>
          States not drawn here follow board 04: hover tints, a 2px focus ring,
          disabled colours. A tap target under 44 keeps a 44 × 44 hit area.
        </p>
        <span className={styles.otherPart}>
          <TextLink href={other.href}>{other.text}</TextLink>
        </span>
      </header>
      <Buttons />
      <TextFields />
      <Chips />
      <TabsSection />
      <CheckboxFields />
      <Alerts />
      <Dividers />
      <KeyHints />
      <PageHeaderSection />
      <BackLinkSection />
      <ActionBarSection />
      <ButtonLinks />
      <LongTextFields />
      <FuzzyDateFields />
      <PersonRows />
    </main>
  );
};

export default InputsKit;
