import type { Metadata } from 'next';

import type { DesktopPart, PhonePart } from '@ks/app/design-kit/inputs/types';

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

// The sections of each part, in the order the page draws them: the link out of a part names them.
const PHONE_PARTS: Record<PhonePart, string[]> = {
  1: ['Buttons', 'Text fields'],
  2: ['Chips', 'Button as a link', 'Long text field'],
  3: ['Tabs', 'Checkbox field', 'Alerts', 'Dividers', 'Key hints'],
  4: [
    'Page header',
    'Back link',
    'Action bar',
    'Fuzzy date field',
    'Person row',
  ],
};

const DESKTOP_PARTS: Record<DesktopPart, string[]> = {
  1: [
    'Buttons',
    'Text fields',
    'Chips',
    'Tabs',
    'Checkbox field',
    'Alerts',
    'Dividers',
    'Key hints',
  ],
  2: [
    'Page header',
    'Back link',
    'Action bar',
    'Button as a link',
    'Long text field',
    'Fuzzy date field',
    'Person row',
  ],
};

const hrefOf = (part: number) =>
  part === 1 ? '/design-kit/inputs' : `/design-kit/inputs?part=${part}`;

const nextLink = (parts: Record<number, string[]>, part: number) => {
  const next = part === Object.keys(parts).length ? 1 : part + 1;

  return {
    href: hrefOf(next),
    text: `Part ${next}: ${parts[next].join(', ')}`,
  };
};

const partOf = (raw: string | string[] | undefined): PhonePart =>
  raw === '2' || raw === '3' || raw === '4' ? (Number(raw) as PhonePart) : 1;

/**
 * Board 06. A desktop shows one of two parts and a phone one of four. `?part=2`, `3` or `4` is
 * that phone part; a desktop shows part 2 for `?part=2` and part 1 for anything else. A link on
 * each width leads to the next part of that width.
 */
const InputsKit = async ({
  searchParams,
}: {
  searchParams: Promise<{ part?: string | string[] }>;
}) => {
  await requireDevPage();

  const part = partOf((await searchParams).part);
  const desktopPart: DesktopPart = part === 2 ? 2 : 1;
  const nextPhone = nextLink(PHONE_PARTS, part);
  const nextDesktop = nextLink(DESKTOP_PARTS, desktopPart);

  return (
    <main
      className={styles.kit}
      data-desktop-part={desktopPart}
      data-part={part}>
      <header className={kit.kitHeader}>
        <span className={kit.kitEyebrow}>
          Style guide · 06
          <span className={styles.partOf}> · part {part} of 4</span>
          <span className={styles.desktopPartOf}>
            {' '}
            · part {desktopPart} of 2
          </span>
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
        <span className={styles.nextPhone}>
          <TextLink href={nextPhone.href}>{nextPhone.text}</TextLink>
        </span>
        <span className={styles.nextDesktop}>
          <TextLink href={nextDesktop.href}>{nextDesktop.text}</TextLink>
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
