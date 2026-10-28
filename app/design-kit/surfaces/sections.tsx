import type { ReactNode } from 'react';

import type { SurfaceLevel } from '@ks/app/components/foundation/types';
import type { Column } from '@ks/app/design-kit/inputs/types';
import type { Source } from '@ks/lib/domain/boundaries/types.ts';

import { Button } from '@ks/app/components/actions/Button';
import { Callout, CalloutPointer } from '@ks/app/components/feedback/Callout';
import { NoticeCard } from '@ks/app/components/feedback/NoticeCard';
import { ProgressBar } from '@ks/app/components/feedback/ProgressBar';
import { Icon } from '@ks/app/components/foundation/Icon';
import { Surface } from '@ks/app/components/foundation/Surface';
import { Avatar } from '@ks/app/components/map/Avatar';
import { DialogPanel } from '@ks/app/components/overlays/Dialog';
import { MenuItem, MenuPanel } from '@ks/app/components/overlays/Menu';
import { Popup } from '@ks/app/components/overlays/Popup';
import { SheetPanel } from '@ks/app/components/overlays/Sheet';
import { SourcesList } from '@ks/app/components/overlays/SourcesDialog';
import { SOURCES_WORDS } from '@ks/app/components/overlays/sourcesWords';
import {
  Accessibility,
  ByViewport,
  Facts,
  Matrix,
  Measurements,
  Section,
  stateOf,
  Variant,
  Variants,
} from '@ks/app/design-kit/inputs/Board';
import {
  CHAIN,
  MENU_GROUPS,
  MENU_WORDS,
  PINS,
} from '@ks/app/design-kit/surfaces/data';
import {
  AccountMenu,
  CopyChainPopup,
} from '@ks/app/design-kit/surfaces/Samples';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

import styles from '@ks/app/design-kit/surfaces/page.module.css';

const code = (text: string) => <code>{text}</code>;

// Every sample sits on the map's sea colour, as the board draws it.
const { map } = resolveTokens(rawTokens);

const Stage = ({
  children,
  compact,
  deep,
  fit,
  side,
  tight,
}: {
  children: ReactNode;
  /** Padding 16 on a phone. */
  compact?: boolean;
  /** Padding 16, 32 below: room for a pointer. */
  deep?: boolean;
  /** As wide as its sample on a phone, not the full row. */
  fit?: boolean;
  /** Padding 40 on the right: room for a pointer. */
  side?: boolean;
  tight?: boolean;
}) => (
  <div
    className={[
      styles.stage,
      side && styles.side,
      tight && styles.tight,
      compact && styles.compact,
      deep && styles.deep,
      fit && styles.fit,
    ]
      .filter(Boolean)
      .join(' ')}
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
        <Stage compact>
          <NoticeCard actions={[...JUMP]} icon='place' title='No pins in 1901'>
            Nobody in your filters is pinned to this date.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant
        caption='Phone width · the same card at full width, 44 buttons.'
        desktop>
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
        <Stage compact>
          <NoticeCard title='No pins in 1901'>
            Nobody in your filters is pinned to this date.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='Loading · title, progress bar, one line. Only on first load.'>
        <Stage compact>
          <NoticeCard progress={45} title='Loading the map'>
            Every border from 1652 to today loads once, up front, so the slider
            never has to wait.
          </NoticeCard>
        </Stage>
      </Variant>
      <Variant caption='Large · no pins in the tree: 28 icon on top, H3 title (22 / 28). Sits in the middle of the map.'>
        <Stage compact>
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
            {code('role="progressbar" ')}with {code('aria-valuenow, ')}
            {code('aria-valuemin="0", ')}
            {code('aria-valuemax="100", ')}labelled by the card title
            &ldquo;Loading the map&rdquo;. The mockup has none of these yet.
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
    <div className={styles.beside}>
      <Variant
        caption='Desktop · 1440 × 900 screen; the body scrolls under the head.'
        desktop>
        <div
          aria-label='Desktop dialog, scrolls sideways'
          className={styles.scroller}
          role='region'
          // A keyboard reaches the sideways scroll through the region's tab stop.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}>
          <div
            className={`${styles.scrimmed} ${styles.screen}`}
            style={{ background: map.sea }}>
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
      <Variant
        caption='Phone · the same content as a bottom sheet over the scrim: handle, title and subtitle with Close, then stacked rows.'
        phone>
        <div
          className={`${styles.scrimmed} ${styles.phone} ${styles.dialogPhone}`}
          style={{ background: map.sea }}>
          <span aria-hidden='true' className={styles.scrim} />
          <div className={styles.over}>
            <DialogPanel form='sheet' {...SOURCES_WORDS} titleId='dialog-sheet'>
              <SourcesList sources={sources} />
            </DialogPanel>
          </div>
        </div>
      </Variant>
      <div className={styles.aside}>
        <Accessibility
          accessibility={[
            [
              'Role',
              <>
                {code('role="dialog"')} with {code('aria-modal="true"')},
                labelled by its title ({code('aria-labelledby')}). A native{' '}
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
                A real table on desktop (column headers); a list on a phone,
                where each item reads layer, source, licence, checked.
              </>,
            ],
          ]}
        />
      </div>
    </div>
    <Measurements
      label='Dialog'
      measurements={[
        [
          'Desktop',
          '760 wide, up to the screen less 80 tall; padding 24 28 28, gap 16, radius 12, modal shadow',
          '760: component size · 28: no token · 80: 2 × space.40 · space.24 · space.16 · radius.panel · shadow.modal · colour.scrim',
        ],
        [
          'Body',
          'Scrolls under the title; a line-strong rule on top; table and footnote 16 apart',
          'colour.line-strong · space.16',
        ],
        [
          'Phone',
          'Full width, up to 56 from the top; padding 8 16 24, gap 12, top radius 18, modal shadow',
          'radius.sheet · shadow.modal (other sheets: shadow.sheet)',
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
          'Columns 170 / rest / 150 / 120, 12 after each; overline header; rows min 44, 4 above and below',
          'type.overline · size.touch · space.12 · space.4',
        ],
        [
          'Text',
          'Layer 14 / 600; source 13 / 20 with its detail under it, 12.5 / 18 ink-3; Checked mono 12',
          'type.label · type.small · type.caption · type.mono',
        ],
        [
          'Licence',
          "Board 04's Link at 13 / 20: brand, 500, 1px underline 3 below; opens in a new tab",
          'colour.brand · radius.link · type.small',
        ],
        [
          'Phone rows',
          'Layer; source, licence and "Checked" date on one wrapping line; detail; 12 around, 4 between',
          'type.label · type.small · type.caption · space.12 · space.4',
        ],
        [
          'Handle',
          '40 × 4, radius 2, line-strong; 8 from the top',
          '40 × 4: component size, no token · colour.line-strong',
        ],
      ]}
      wide
    />
  </Section>
);

const SHEET_CONTENT = (
  <p className={styles.sheetText}>The sheet&apos;s content starts here.</p>
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
            The title is a real {code('h2 ')}and labels the sheet&apos;s dialog.
          </>,
        ],
        ['Close', <>{code('aria-label="Close"; ')}Esc does the same.</>],
        [
          'Handle',
          <>
            Decoration on an open sheet {code('(aria-hidden). ')}On the
            collapsed date sheet it is a button, &quot;Expand the sheet&quot;,
            which isn&apos;t covered here.
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

const MENU_ITEM = MENU_GROUPS[0][1];
const TWO_LINES = MENU_GROUPS[0][0];

const ITEM_ROWS = [
  { entry: MENU_ITEM, hint: 'Icon and label', name: 'Menu item' },
  {
    entry: TWO_LINES,
    hint: 'Icon, label, second line',
    name: 'Menu item, two lines',
  },
].map(({ entry, hint, name }) => ({
  hint,
  inert: true,
  name,
  render: (column: Column) => (
    <span className={styles.itemSample}>
      <MenuItem
        entry={{ ...entry, disabled: column === 'disabled' || undefined }}
        state={stateOf(column)}
      />
    </span>
  ),
}));

const AVATAR_COLUMNS: { column: Column; phoneTitle?: string; title: string }[] =
  [
    { column: 'default', title: 'Default' },
    { column: 'hover', title: 'Hover' },
    { column: 'focus', phoneTitle: 'Focus', title: 'Focus (keyboard)' },
    { column: 'active', title: 'Open' },
  ];

export const Menus = ({ sources }: { sources: Source[] }) => (
  <Section
    lead='A short list of actions behind a trigger. Today only the account menu, opened from the avatar.'
    part={2}
    title='Menu'>
    <Variants>
      <Variant caption='Opened from the avatar, 296 wide; the same on desktop and phone. "Export all data" is shown hovered.'>
        <Stage compact fit>
          <MenuPanel
            {...MENU_WORDS}
            groups={MENU_GROUPS}
            hovered='export'
            inert
          />
        </Stage>
      </Variant>
    </Variants>
    <Matrix label='Menu item states' rows={ITEM_ROWS} />
    <Matrix
      columns={AVATAR_COLUMNS}
      label='Avatar states'
      rows={[
        {
          hint: 'Desktop and phone alike: raised shadow, no border',
          name: 'Avatar',
          render: column =>
            column === 'default' ? (
              <AccountMenu sources={sources} />
            ) : (
              <Avatar
                expanded={column === 'active'}
                initial={MENU_WORDS.initial}
                state={stateOf(column)}
              />
            ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Trigger',
          <>
            The avatar is a {code('button ')}named &quot;Account menu&quot;,
            with {code('aria-haspopup="menu" ')}and {code('aria-expanded.')}
          </>,
        ],
        [
          'Role',
          <>
            {code('role="menu" ')}with {code('menuitem ')}children. The header
            and footer text sit outside the menuitems {code('(role="none" ')}or
            a labelled group) so arrow keys skip them.
          </>,
        ],
        [
          'Keyboard',
          'Opening moves focus to the first item. Up and Down move, Enter activates, Esc closes and returns focus to the avatar. Tab leaves and closes.',
        ],
        [
          'Name',
          <>
            The menu is labelled &quot;Account&quot;. Icons are{' '}
            {code('aria-hidden.')}
          </>,
        ],
      ]}
      label='Menu'
      measurements={[
        [
          'Menu',
          '296 wide, white, radius 12, floating shadow; 4 inside',
          '296: component size, no token · radius.panel · shadow.floating · space.4',
        ],
        [
          'Header',
          '"Signed in as" 12.5 / 18 ink-3, 4 above the email 14 / 600; padding 12',
          'type.caption · type.label · space.4 · space.12',
        ],
        [
          'Item',
          'min 44; padding 4 12; icon 18, 12 to the label; radius 8. The two-line item is 52 tall',
          'size.touch · size.row-l · space.12 · radius.control',
        ],
        [
          'Label',
          '14 / 20 · 600; second line 12.5 / 18 ink-3',
          'type.label · type.caption',
        ],
        ['Hover', 'surface-2 fill', 'colour.surface-2'],
        [
          'Divider',
          '1px line, 8 in from the sides, 4 above and below',
          'colour.line · space.8 · space.4',
        ],
        [
          'Footer',
          'Last backup, 12.5 / 18 ink-3, padding 8 12',
          'type.caption',
        ],
        [
          'Avatar',
          '44 round, brand, white initial 16 / 600, raised shadow, no border',
          'size.touch · type.button · shadow.raised',
        ],
      ]}
    />
  </Section>
);

const HIT_NOTE = '44 × 44 hit area';

export const Popups = () => (
  <Section
    lead='Answers "what was this spot part of on the map date?" where you clicked: the Jurisdiction chain and the pins there.'
    part={2}
    title='Popup'>
    <Variants>
      <Variant
        caption='Desktop · 304 wide, floating, pointing at the clicked spot. Overline, place name, coordinates, Close; the chain; the pins here; Copy chain.'
        desktop>
        <Stage side>
          <CopyChainPopup />
        </Stage>
      </Variant>
      <Variant
        caption='Close and Copy chain keep their 36 visual size, each with a hit area of its own.'
        desktop>
        <div className={styles.hits}>
          <span className={styles.hit}>
            <span className={styles.hitClose}>
              <Icon name='close' size={16} />
            </span>
            <span className={styles.hitNote}>{HIT_NOTE}</span>
          </span>
          <span className={styles.hit}>
            <Button icon='copy' size='xs' tabIndex={-1}>
              Copy chain
            </Button>
            <span className={styles.hitNote}>{HIT_NOTE}</span>
          </span>
        </div>
      </Variant>
      <Variant caption='Phone · the same look-up inside the bottom sheet, below the date controls (not shown). No Copy chain, no inset box; coordinates beside the name.'>
        <SheetFrame>
          <Popup
            chain={CHAIN}
            coordinates='28.738° S · 24.764° E'
            form='sheet'
            pins={PINS}
            place='Kimberley'
            year={1901}
          />
        </SheetFrame>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            Desktop: a non-modal {code('role="dialog" ')}named
            &quot;Jurisdiction at this point&quot;. Phone: a region of the
            bottom sheet named by its overline.
          </>,
        ],
        [
          'Focus',
          'Opening a popup with the keyboard moves focus to it; Esc or Close returns focus to the map.',
        ],
        [
          'Chain',
          <>
            An ordered list {code('(<ol>), ')}smallest unit first. Each row
            reads level then name.
          </>,
        ],
        [
          'Pins',
          <>
            Each pin is a link to its record. The glyph is{' '}
            {code('aria-hidden; ')}the event name says what it is.
          </>,
        ],
        [
          'Copy chain',
          'Copies the chain as text and confirms with the "Jurisdiction chain copied." toast (board 05).',
        ],
      ]}
      label='Popup'
      measurements={[
        [
          'Popup',
          '304 wide, radius 12, floating shadow, padding 16, gap 12; pointer a 16 square turned 45°, radius 2',
          '304: component size, no token · radius.panel · shadow.floating · space.16 · space.12',
        ],
        [
          'Header',
          'Overline "On this spot in {year}" · place name H3, Bricolage 22 / 28 · 700 · coordinates mono 12 / 16 ink-3',
          'type.overline · type.h3 · type.mono',
        ],
        [
          'Close',
          '36 × 36 round, ink-3, 16px icon, pulled 8 up and 8 right; 44 × 44 hit area',
          'size.control-xs',
        ],
        [
          'Chain rows',
          <ByViewport
            desktop='Grid 76 / rest, gap 8; 8 above and below; 1px line between. Label overline; value 15 / 22 · 600; detail 12.5 / 18 ink-3'
            key='grid'
            phone='Grid 72 / rest, gap 8; 8 above and below; 1px line between. Label overline; value 15 / 22 · 600; detail 12.5 / 18 ink-3'
          />,
          'type.overline · type.title · type.caption · space.8',
        ],
        [
          'Pins here',
          <ByViewport
            desktop='Inset: surface-2, radius 8, padding 12, gap 8; row min 32. Glyph 14 pin, 8 to the title 14 / 600, people 13 / 20 ink-3, date mono 12 ink-2'
            key='pins'
            phone='Row min 44, no inset. Glyph 14 pin, 8 to the title 14 / 600, people 13 / 20 ink-3, date mono 12 ink-2'
          />,
          <ByViewport
            desktop='colour.surface-2 · type.label · type.small · type.mono · 32: no token'
            key='pins-token'
            phone='colour.surface-2 · type.label · type.small · type.mono'
          />,
        ],
        [
          'Copy chain',
          'Desktop: 36 secondary with the copy icon (board 06), 44 × 44 hit area. The phone look-up has no Close and no Copy chain',
          'size.control-xs',
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
      <Variant
        caption='Pointer offset · desktop dock: the pointer sits over the date field, 136 from the left edge.'
        desktop>
        <Stage>
          <div className={styles.callout}>
            <Callout id='callout-offset'>
              {MESSAGE} Press Esc to go back to it.
            </Callout>
            <CalloutPointer className={`${styles.pointer} ${styles.offset}`} />
          </div>
        </Stage>
      </Variant>
      <Variant
        caption='Pointer centred · the same callout pointing at something directly below its middle. In place above the dock: see board 05.'
        desktop>
        <Stage>
          <div className={styles.callout}>
            <Callout id='callout-centred'>
              {MESSAGE} Press Esc to go back to it.
            </Callout>
            <CalloutPointer className={`${styles.pointer} ${styles.centred}`} />
          </div>
        </Stage>
      </Variant>
      <Variant
        caption='Phone · full width over the date sheet, with a "Go to 1901-02-28" link; pointer 149 from the left. The 28-days example in place is on board 05.'
        phone>
        <Stage deep>
          <div className={`${styles.callout} ${styles.phoneCallout}`}>
            <Callout className={styles.sheetCallout} id='callout-sheet'>
              <span>{MESSAGE}</span>
              <button className={styles.goTo} type='button'>
                Go to 1901-02-28
              </button>
            </Callout>
            <CalloutPointer
              className={`${styles.pointer} ${styles.sheetPointer}`}
            />
          </div>
        </Stage>
      </Variant>
      <Variant
        caption='Phone · full width less the gutters, 13 / 20, with a "Go to" link.'
        desktop>
        <Stage deep>
          <div className={`${styles.callout} ${styles.phoneCallout}`}>
            <Callout className={styles.sheetCallout} id='callout-phone'>
              <span>{MESSAGE}</span>
              <button className={styles.goTo} type='button'>
                Go to 1901-02-28
              </button>
            </Callout>
            <CalloutPointer
              className={`${styles.pointer} ${styles.sheetPointer}`}
            />
          </div>
        </Stage>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            {code('role="alert", ')}with an {code('id ')}the field points at
            through {code('aria-describedby.')}
          </>,
        ],
        [
          'Keyboard',
          <ByViewport
            desktop='Esc restores the last good date and closes the callout.'
            key='keyboard'
            phone='Esc restores the last good date and closes the callout, and the Go to link offers the same fix to touch.'
          />,
        ],
        ['Pointer', <>Decoration (a styled {code('span), ')}never read.</>],
      ]}
      label='Callout'
      measurements={[
        [
          'Box',
          <ByViewport
            desktop='340 wide · padding 12 · radius 8'
            key='box'
            phone='Full width less 16 gutters · padding 12 16 · radius 8'
          />,
          <ByViewport
            desktop='340: component size, no token · space.12 · radius.control'
            key='box-token'
            phone='size.gutter-phone · space.12 · space.16 · radius.control'
          />,
        ],
        [
          'Colours',
          'error-bg, 1px error-border, error text',
          'colour.error-bg · colour.error-border · colour.error',
        ],
        ['Text', '13 / 20; first sentence 600', 'type.small'],
        [
          'Fix link',
          'Phone: "Go to" the last good date, 4 below the text, as a Link at 13 / 20. It sits in the message, so it keeps its text height (DM.12.2 D3)',
          'type.link-s',
        ],
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
