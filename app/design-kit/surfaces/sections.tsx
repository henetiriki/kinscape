import type { ReactNode } from 'react';

import type { Source } from '@/lib/boundaries/model.mts';

import { Callout, CalloutPointer } from '@/app/components/Callout';
import { DialogPanel } from '@/app/components/Dialog';
import { NoticeCard } from '@/app/components/NoticeCard';
import { ProgressBar } from '@/app/components/ProgressBar';
import { SheetPanel } from '@/app/components/Sheet';
import { SourcesList } from '@/app/components/SourcesDialog';
import { SOURCES_WORDS } from '@/app/components/sourcesWords';
import { Surface, type SurfaceLevel } from '@/app/components/Surface';
import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import { Facts, Section, Variant, Variants } from '../inputs/Board';
import styles from './page.module.css';

const code = (text: string) => <code>{text}</code>;

// Every sample sits on the map's sea colour, as the board draws it.
const { map } = resolveTokens(rawTokens);

const Stage = ({
  children,
  tight,
}: {
  children: ReactNode;
  tight?: boolean;
}) => (
  <div
    className={tight ? `${styles.stage} ${styles.tight}` : styles.stage}
    style={{ background: map.sea }}>
    {children}
  </div>
);

const LEVELS: {
  level: SurfaceLevel;
  title: string;
  token: string;
  used: string;
}[] = [
  {
    level: 'raised',
    title: 'Raised',
    token: 'shadow.raised',
    used: 'Panel, date dock, search bar and pill, avatar, notice cards, map controls, layers button',
  },
  {
    level: 'floating',
    title: 'Floating',
    token: 'shadow.floating',
    used: 'Jurisdiction popup, account menu, toasts, the date callout',
  },
  {
    level: 'modal',
    title: 'Modal',
    token: 'shadow.modal',
    used: 'Dialog, over the scrim',
  },
  {
    level: 'sheet',
    title: 'Sheet',
    token: 'shadow.sheet',
    used: 'Phone bottom sheets (top corners 18)',
  },
];

export const Surfaces = () => (
  <Section
    lead='Everything that sits above the map is a white surface at one of four levels. The higher it sits, the more it interrupts.'
    part={1}
    title='Surface'>
    <Variants>
      <Variant caption='Each level on the map colour. All are white with radius 12; sheets round only the top corners, 18.'>
        <Stage>
          {LEVELS.map(({ level, title, token, used }) => (
            <Surface className={styles.level} key={level} level={level}>
              <span className={styles.levelTitle}>{title}</span>
              <span className={styles.levelUsed}>{used}</span>
              <span className={styles.mono}>{token}</span>
            </Surface>
          ))}
        </Stage>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Contrast',
          'Shadows separate surfaces but carry no meaning. Text on white passes 4.5:1; borders are not needed for contrast.',
        ],
        [
          'Scrim',
          <>
            The modal level always comes with the scrim, which blocks the map
            for pointer and screen reader alike ({code('aria-modal="true"')}).
          </>,
        ],
      ]}
      label='Surface'
      measurements={[
        ['Fill', 'white', 'colour.surface'],
        [
          'Radius',
          '12 · phone sheets 18 on top',
          'radius.panel · radius.sheet',
        ],
        [
          'Raised',
          'panels, dock, search bar and pill, avatar, notice cards, map controls',
          'shadow.raised',
        ],
        ['Floating', 'popups, menus and the date callout', 'shadow.floating'],
        [
          'Modal',
          'dialogs, with the scrim behind',
          'shadow.modal · colour.scrim',
        ],
        ['Sheet', 'phone sheets', 'shadow.sheet'],
        [
          'Off the scale',
          'The banner on board 05 keeps its 0 6 20 / 0.2',
          'no token',
        ],
      ]}
    />
  </Section>
);

const JUMP = [{ label: 'Jump to 1898' }, { label: 'Clear filters' }] as const;

export const NoticeCards = () => (
  <Section
    lead="For empty and loading states on the map. Says what's going on in one line and offers at most two ways out."
    part={1}
    title='Notice card'>
    <Variants>
      <Variant caption='Icon and buttons · no pins on this date. Up to two buttons, lined up with the text.'>
        <Stage>
          <NoticeCard actions={[...JUMP]} icon='place' title='No pins in 1901'>
            Nobody in your filters is pinned to this date.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='Phone width · the same card at full width, 44 buttons.'>
        <Stage tight>
          <NoticeCard
            actions={[...JUMP]}
            icon='place'
            phone
            title='No pins in 1901'>
            Nobody in your filters is pinned to this date.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='No icon · title and one line. Not on a screen yet; built from the same parts.'>
        <Stage>
          <NoticeCard title='No pins in 1901'>
            Nobody in your filters is pinned to this date.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='Loading · title, progress bar, one line. Only on first load.'>
        <Stage>
          <NoticeCard progress={45} title='Loading the map'>
            Every border from 1652 to today loads once, up front, so the slider
            never has to wait.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='Large · no pins in the tree: 28 icon on top, H3 title (22 / 28). Sits in the middle of the map.'>
        <Stage>
          <NoticeCard icon='place' size='large' title='No pins yet'>
            Pins show up here on the dates they were true. Until then the map
            works as an atlas: move the date and watch the borders change.
          </NoticeCard>
        </Stage>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="status"')}, so the change is announced politely. The
            loading card adds {code('aria-live="polite"')}.
          </>,
        ],
        ['Icon', <>{code('aria-hidden')}.</>],
        [
          'Buttons',
          'Real buttons in reading order after the text. Jump to moves the map date; Clear filters clears every filter.',
        ],
        [
          'Focus',
          'The card never takes focus; it explains, and the buttons are there to Tab to.',
        ],
      ]}
      label='Notice card'
      measurements={[
        [
          'Width',
          '360 on desktop (380 for the large form) · full width less 16 gutters on a phone',
          '360, 380: component size, no token · size.gutter-phone',
        ],
        ['Padding', '16 · loading 16 20 · large 20', 'space.16 · space.20'],
        [
          'Gap',
          '12 inside (8 in the large form); icon 20, 12 from the text; buttons indent 32',
          'space.12 · space.8 · space.32',
        ],
        [
          'Title',
          '15 / 22 · 600 · large form H3, Bricolage 22 / 28 · 700',
          'type.title · type.h3',
        ],
        [
          'Line',
          '15 / 22 ink-2 · loading 13 / 20 ink-3',
          'type.body · type.small',
        ],
        [
          'Buttons',
          '40 tall: primary then secondary, 8 apart',
          'size.control-s · space.8',
        ],
        [
          'Surface',
          'white, radius 12, raised shadow',
          'colour.surface · radius.panel · shadow.raised',
        ],
      ]}
    />
  </Section>
);

const SHARES = [0, 45, 100] as const;

export const ProgressBars = () => (
  <Section
    lead='Shows how much of the first load is done. Only ever inside the loading notice card.'
    part={1}
    title='Progress bar'>
    <Variants>
      <Variant caption='Determinate, as the loading card shows it: the fill is 45% of the track. Shown at 0, 45 and 100.'>
        <div className={styles.bars}>
          {SHARES.map(share => (
            <div className={styles.bar} key={share}>
              <span className={styles.barLabel} id={`progress-${share}`}>
                {share}%
              </span>
              <ProgressBar labelledBy={`progress-${share}`} value={share} />
            </div>
          ))}
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="progressbar"')} with {code('aria-valuenow')},{' '}
            {code('aria-valuemin="0"')}, {code('aria-valuemax="100"')}, labelled
            by the card title &ldquo;Loading the map&rdquo;.
          </>,
        ],
        [
          'Motion',
          <>
            Width changes without easing under {code('prefers-reduced-motion')}.
          </>,
        ],
      ]}
      label='Progress bar'
      measurements={[
        [
          'Track',
          '6 tall, fully round (3), line',
          '6, 3: component size, no token · colour.line',
        ],
        [
          'Fill',
          'brand, same height and radius; width is the share loaded',
          'colour.brand',
        ],
        ['Width', 'Fills the card', '—'],
        [
          'Kind',
          'Determinate. There is no indeterminate form on any screen',
          '—',
        ],
      ]}
    />
  </Section>
);

export const Dialogs = ({ sources }: { sources: Source[] }) => (
  <Section
    lead="For a task or a long read that needs the whole screen's attention. Sources and attributions is the only one so far."
    part={1}
    title='Dialog'>
    <Variants>
      <Variant caption='Desktop · centred over the scrim, 760 wide. Title, subtitle, a scrolling body and a footnote.'>
        <div
          aria-label='Desktop dialog, scrolls sideways'
          className={styles.scroller}
          role='region'
          // A keyboard reaches the sideways scroll through the region's tab stop.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}>
          <div className={styles.scrimmed} style={{ background: map.sea }}>
            <span aria-hidden='true' className={styles.scrim} />
            <div className={styles.over}>
              <DialogPanel
                form='centred'
                {...SOURCES_WORDS}
                titleId='dialog-centred'>
                <SourcesList sources={sources} />
              </DialogPanel>
            </div>
          </div>
        </div>
      </Variant>
      <Variant caption='Phone · the same content as a bottom sheet over the scrim: handle, title and subtitle with Close, then stacked rows.'>
        <div
          className={`${styles.scrimmed} ${styles.phone}`}
          style={{ background: map.sea }}>
          <span aria-hidden='true' className={styles.scrim} />
          <div className={styles.over}>
            <DialogPanel form='sheet' {...SOURCES_WORDS} titleId='dialog-sheet'>
              <SourcesList sources={sources} />
            </DialogPanel>
          </div>
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="dialog"')} with {code('aria-modal="true"')}, labelled
            by its title ({code('aria-labelledby')}). A native{' '}
            {code('<dialog>')} opened with {code('showModal')} gives both.
          </>,
        ],
        [
          'Focus',
          'Opening moves focus into the dialog (the Close button); Tab stays inside; closing returns focus to the link or menu item that opened it.',
        ],
        [
          'Keyboard',
          'Esc closes. Close is always there; the scrim closes too.',
        ],
        [
          'Table',
          <>
            A real table on desktop (column headers); a list on a phone, where
            each item reads layer, source, licence, checked.
          </>,
        ],
      ]}
      label='Dialog'
      measurements={[
        [
          'Desktop',
          '760 wide, padding 24 28 28, gap 16, radius 12, modal shadow, over the scrim',
          '760: component size · 28: no token (32 would move it 4px) · space.24 · space.16 · radius.panel · shadow.modal · colour.scrim',
        ],
        [
          'Phone',
          'Full width from 56 below the top, padding 8 16 24, gap 12, top radius 18, modal shadow',
          'radius.sheet · shadow.modal (other sheets use shadow.sheet)',
        ],
        [
          'Title',
          'H2: Bricolage 24 / 32 · 700; subtitle 15 / 22 ink-2, 4 below',
          'type.h2 · type.body',
        ],
        [
          'Close',
          '44 × 44, fully round, ink-3; icon 18 desktop, 20 phone; pulled into the corner',
          'size.touch · radius.full',
        ],
        [
          'Table',
          'Columns 170 / rest / 150 / 120, gap 12; header row overline; rows min 44; layer 14 / 600, the rest 13 / 20; Checked in mono 12',
          'type.overline · size.touch · type.label · type.small · type.mono',
        ],
        [
          'Phone rows',
          'Layer 14 / 600; then source, licence and "Checked" with its date on one wrapping line, 13 / 20; 12 above and below',
          'type.label · type.small · space.12',
        ],
        [
          'Handle',
          '40 × 4, radius 2, line-strong; 8 from the top',
          '40 × 4: component size, no token · colour.line-strong',
        ],
      ]}
    />
  </Section>
);

const SHEET_CONTENT = (
  <p className={styles.sheetText}>The sheet&rsquo;s content starts here.</p>
);

const TABS = [
  { label: 'Layers', value: 'layers' },
  { count: 1, label: 'Filters', value: 'filters' },
];

const SheetFrame = ({ children }: { children: ReactNode }) => (
  <div
    className={`${styles.scrimmed} ${styles.phone}`}
    style={{ background: map.sea }}>
    <Surface level='sheet'>{children}</Surface>
  </div>
);

export const SheetHeaders = () => (
  <Section
    lead='The top of every phone bottom sheet: a handle, then one of three header rows.'
    part={2}
    title='Phone sheet header'>
    <Variants>
      <Variant caption="Title and Close · the design kit's Boards sheet. H2 24 / 32.">
        <SheetFrame>
          <SheetPanel title='Boards' titleId='head-title'>
            {SHEET_CONTENT}
          </SheetPanel>
        </SheetFrame>
      </Variant>
      <Variant caption='Tabs and Close · Layers and filters. Tabs 44 tall share the row.'>
        <SheetFrame>
          <SheetPanel
            tabs={{
              label: 'Layers and filters',
              selected: 'layers',
              tabs: TABS,
            }}
            titleId='head-tabs'>
            {SHEET_CONTENT}
          </SheetPanel>
        </SheetFrame>
      </Variant>
      <Variant caption='Title, subtitle and Close · Sources and attributions; its list is in the Dialog section.'>
        <SheetFrame>
          <SheetPanel
            subtitle={SOURCES_WORDS.subtitle}
            title={SOURCES_WORDS.title}
            titleId='head-subtitle'>
            {SHEET_CONTENT}
          </SheetPanel>
        </SheetFrame>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Heading',
          <>
            The title is a real {code('h2')} and labels the sheet&rsquo;s
            dialog.
          </>,
        ],
        ['Close', <>{code('aria-label="Close"')}; Esc does the same.</>],
        [
          'Handle',
          <>
            Decoration on an open sheet ({code('aria-hidden')}). On the
            collapsed date sheet it is a button, &ldquo;Expand the sheet&rdquo;,
            which isn&rsquo;t covered here.
          </>,
        ],
      ]}
      label='Phone sheet header'
      measurements={[
        [
          'Handle',
          '40 × 4, radius 2, line-strong, centred, 8 from the top edge',
          '40 × 4: component size, no token',
        ],
        [
          'Padding',
          '8 16 at the top; 8 (tabs) or 12 (title) from handle to header',
          'space.8 · space.16 · space.12',
        ],
        ['Title', 'H2 24 / 32 · 700', 'type.h2'],
        [
          'Close',
          '44 × 44 round, ink-3, 20px icon; its right edge pulled 8 into the gutter so the icon lines up with the text column',
          'size.touch',
        ],
        [
          'Tabs row',
          'Tabs share the row, gap 8 to Close, 8 below, then a 1px line',
          'space.8 · colour.line',
        ],
      ]}
    />
  </Section>
);

const MESSAGE = (
  <>
    <strong>February 1901 has 28 days.</strong> The map still shows 1901-02-28.
  </>
);

export const Callouts = () => (
  <Section
    lead='A message that belongs to one control and has to point at it: today, the error on the map date field in the dock.'
    part={2}
    title='Callout'>
    <Variants>
      <Variant caption='Pointer offset · desktop dock: the pointer sits over the date field, 136 from the left edge.'>
        <Stage>
          <div className={styles.callout}>
            <Callout id='callout-offset'>
              {MESSAGE} Press Esc to go back to it.
            </Callout>
            <CalloutPointer className={`${styles.pointer} ${styles.offset}`} />
          </div>
        </Stage>
      </Variant>
      <Variant caption='Pointer centred · the same callout pointing at something directly below its middle. In place above the dock: see board 05.'>
        <Stage>
          <div className={styles.callout}>
            <Callout id='callout-centred'>
              {MESSAGE} Press Esc to go back to it.
            </Callout>
            <CalloutPointer className={`${styles.pointer} ${styles.centred}`} />
          </div>
        </Stage>
      </Variant>
      <Variant caption='Phone · full width less the gutters, 14 / 20, with a "Go to" link.'>
        <Stage tight>
          <div className={`${styles.callout} ${styles.phoneCallout}`}>
            <Callout id='callout-phone'>
              {MESSAGE}{' '}
              <button className={styles.goTo} type='button'>
                Go to 1901-02-28
              </button>
            </Callout>
            <CalloutPointer className={`${styles.pointer} ${styles.centred}`} />
          </div>
        </Stage>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="alert"')} with an {code('id')} the field points at
            through {code('aria-describedby')}.
          </>,
        ],
        ['Keyboard', 'Esc restores the last good date and closes the callout.'],
        ['Pointer', <>Decoration (a styled {code('span')}), never read.</>],
      ]}
      label='Callout'
      measurements={[
        [
          'Box',
          '340 wide · padding 12 · radius 8',
          '340: component size, no token · space.12 · radius.control',
        ],
        [
          'Colours',
          'error-bg, 1px error-border, error text',
          'colour.error-bg · colour.error-border · colour.error',
        ],
        ['Text', '13 / 20; first sentence 600', 'type.small'],
        [
          'Pointer',
          "12 square turned 45°, error-bg with the box's border on its two outer sides, 7 below the box",
          '12, 7: component size, no token',
        ],
        ['Shadow', 'floating, as a popup', 'shadow.floating'],
        [
          'Place',
          "Opens above the field it belongs to, so it isn't cut off at the bottom of the screen",
          '—',
        ],
      ]}
    />
  </Section>
);
