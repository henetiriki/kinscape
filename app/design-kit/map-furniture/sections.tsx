import type { ReactNode } from 'react';

import { Avatar } from '@/app/components/Avatar';
import { Chip } from '@/app/components/Chip';
import { EventGlyph, type EventType } from '@/app/components/EventGlyph';
import { LayersButton } from '@/app/components/LayersButton';
import { Legend } from '@/app/components/Legend';
import { SearchBar } from '@/app/components/SearchBar';
import { Wordmark } from '@/app/components/Wordmark';
import rawTokens from '@/design/tokens.json';
import { resolveTokens } from '@/lib/design/tokens.mts';

import {
  type Column,
  Facts,
  Matrix,
  Section,
  stateOf,
  Variant,
  Variants,
} from '../inputs/Board';
import styles from './page.module.css';
import { ZoomDemo } from './ZoomDemo';

const code = (text: string) => <code>{text}</code>;

// Samples that sit on the map sit on its sea colour, as the board draws them.
const { map } = resolveTokens(rawTokens);

const Stage = ({ children }: { children: ReactNode }) => (
  <div className={styles.stage} style={{ background: map.sea }}>
    {children}
  </div>
);

const NAMES: Record<EventType, string> = {
  baptism: 'Baptism',
  birth: 'Birth',
  burial: 'Burial',
  death: 'Death',
  land: 'Land',
  marriage: 'Marriage',
  occupation: 'Occupation',
  other: 'Other',
  residence: 'Residence',
};

const ZoomCard = ({ column }: { column: Column }) => (
  <ZoomDemo atMax={column === 'disabled'} state={stateOf(column)} />
);

const PillAvatar = () => <Avatar initial='L' />;

export const Wordmarks = () => (
  <Section
    lead='The icon, then "KinScape" in Bricolage Grotesque 700. Drop the name only where there is no room for it.'
    part={1}
    title='Wordmark'>
    <Variants>
      <Variant caption='Sign-in, desktop · icon 44 (radius 11), name H2, Bricolage 24 / 32 · 700, 12 apart.'>
        <Wordmark size={44} />
      </Variant>
      <Variant caption='Sign-in, phone · icon 36 (radius 9), name H3, 22 / 28, 12 apart, over the map strip.'>
        <span className={styles.strip} style={{ background: map.sea }}>
          <Wordmark size={36} />
        </span>
      </Variant>
      <Variant caption='Map search bar · icon 32 (radius 8), name H3, 22 / 28, 12 apart.'>
        <Wordmark size={32} />
      </Variant>
      <Variant caption='Icon only · the phone search pill: 32, radius 8, alt "KinScape".'>
        <Wordmark iconOnly size={32} />
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Alt',
          <>
            Beside the name the icon is decoration: {code('alt=""')}. Alone (the
            phone pill) it is {code('alt="KinScape"')}.
          </>,
        ],
        [
          'Link',
          'On the map the wordmark is not a link. If it becomes one, it goes to the map at the current date and is named "KinScape, map".',
        ],
      ]}
      label='Wordmark'
      measurements={[
        [
          'Icon',
          'app/icon0.svg, never recoloured; corner radius 25% of its size (11, 9, 8)',
          '44 = size.touch · 36, 32: no token · 11, 9: no token · radius.control (8)',
        ],
        [
          'Name',
          '"KinScape", capital S, Bricolage Grotesque 700: H2 on desktop sign-in, H3 everywhere else',
          'type.h2 · type.h3',
        ],
        ['Gap', '12 between icon and name', 'space.12'],
        ['Colour', 'ink', 'colour.ink'],
      ]}
    />
  </Section>
);

export const SearchBars = () => (
  <Section
    lead='Top left on desktop, a full-width pill on a phone. Finds people and places; results are designed later.'
    part={1}
    title='Search bar'>
    <Variants>
      <Variant
        caption='Desktop, default. Wordmark, a 1px divider, then the 340 search field.'
        desktop>
        <Stage>
          <SearchBar form='bar' />
        </Stage>
      </Variant>
      <Variant caption='Desktop, with text.' desktop>
        <Stage>
          <SearchBar defaultValue='Kimberley' form='bar' />
        </Stage>
      </Variant>
      <Variant caption='Phone pill, default. Icon, the bare field, the avatar.'>
        <Stage>
          <div className={styles.pillHolder}>
            <SearchBar account={<PillAvatar />} form='pill' />
          </div>
        </Stage>
      </Variant>
      <Variant caption='Phone pill, with text.'>
        <Stage>
          <div className={styles.pillHolder}>
            <SearchBar
              account={<PillAvatar />}
              defaultValue='Kimberley'
              form='pill'
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
            Wrap it in {code('role="search"')}. The input is{' '}
            {code('type="search"')}, named &ldquo;Search people and
            places&rdquo;.
          </>,
        ],
        [
          'Keyboard',
          '"/" focuses the field from anywhere on the map (desktop). Esc clears, then leaves.',
        ],
        [
          'Focus',
          <>
            The mockups set {code('outline: none')} and draw no focus, so it
            isn&rsquo;t drawn here; it follows board 04.
          </>,
        ],
        ['Results', 'Search results are not designed yet (EXP-04).'],
      ]}
      label='Search bar'
      measurements={[
        [
          'Desktop bar',
          '52 tall, padding 0 8 0 12, gap 12, radius 12, raised; 24 from the left and 20 from the top of the map',
          '52: size.search · space.8 · space.12 · radius.panel · shadow.raised',
        ],
        [
          'Divider',
          '1 × 28, line',
          'colour.line · 28: component size, no token',
        ],
        [
          'Field',
          '340 × 44, surface-2, radius 8, no border, padding 0 12, gap 8; text 15 / 22; "/" key hint (board 06)',
          'size.field · colour.surface-2 · type.body · space.12 · space.8 · 340: component size, no token',
        ],
        [
          'Phone pill',
          '52 tall, fully round (26), padding 0 4 0 12, gap 12, raised; 16 from the edges. The same on every phone screen',
          '52: size.search · radius.full · space.4 · space.12 · size.gutter-phone · shadow.raised',
        ],
        [
          'Phone field',
          "Bare, 44 tall, 16 text so the browser doesn't zoom",
          'size.field · type.body-l',
        ],
        [
          'Avatar',
          '44 round, brand, raised (board 07)',
          'size.touch · shadow.raised',
        ],
      ]}
    />
  </Section>
);

export const MapControls = () => (
  <Section
    lead='Zoom and fit on desktop; on a phone, one button opens the layers. Pinch and drag do the rest.'
    part={1}
    title='Map controls'>
    <Variants>
      <Variant
        caption='Desktop · zoom in, zoom out and fit, stacked in one raised card, 1px lines between. Top right, under the avatar.'
        desktop>
        <Stage>
          <ZoomDemo />
        </Stage>
      </Variant>
      <Variant caption='Phone · one 48 layers button, right edge under the search pill. Opens Layers and filters.'>
        <Stage>
          <LayersButton />
        </Stage>
      </Variant>
    </Variants>
    <Matrix
      label='Map control states'
      rows={[
        {
          hint: 'State shown on Zoom in',
          name: 'Zoom card',
          render: column => <ZoomCard column={column} />,
        },
        {
          hint: 'Phone',
          name: 'Layers button',
          render: column => (
            <LayersButton
              disabled={column === 'disabled'}
              state={stateOf(column)}
            />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Names',
          <>
            &ldquo;Zoom in&rdquo;, &ldquo;Zoom out&rdquo;, &ldquo;Fit South
            Africa&rdquo;, &ldquo;Layers and filters&rdquo;. Icons are{' '}
            {code('aria-hidden')}.
          </>,
        ],
        [
          'Disabled',
          <>
            At the zoom limit use {code('aria-disabled="true"')} so the button
            stays in the Tab order and says why.
          </>,
        ],
        [
          'Focus',
          <>
            The card does not clip its buttons ({code('overflow: visible')}), so
            the outside focus ring is whole.
          </>,
        ],
        ['Keyboard', 'The map itself also takes + and −.'],
      ]}
      label='Map controls'
      measurements={[
        [
          'Buttons',
          '44 × 44 in the card · layers button 48 × 48',
          'size.touch · size.field-l',
        ],
        [
          'Card',
          'white, radius 12, raised; 1px line between buttons',
          'radius.panel · shadow.raised · colour.line',
        ],
        [
          'Layers button',
          'white, radius 12, raised on every phone screen',
          'radius.panel · shadow.raised',
        ],
        [
          'Icons',
          'zoom in, zoom out and fit 18 · layers 24; all stroke 2, ink',
          'colour.ink',
        ],
        [
          'States',
          "As board 04's icon button: surface-2 hover, brand-tint pressed, icon-disabled at the zoom limit",
          'colour.surface-2 · colour.brand-tint · colour.icon-disabled',
        ],
        [
          'Place',
          'Desktop: 24 from the right, 88 from the top · phone: 16 from the right, 80 from the top',
          'size.gutter · size.gutter-phone',
        ],
      ]}
    />
  </Section>
);

const SIZES = [12, 14, 16] as const;

// The order board 08 draws them in.
const BOARD_ORDER: EventType[] = [
  'birth',
  'baptism',
  'residence',
  'marriage',
  'death',
  'burial',
  'land',
  'occupation',
  'other',
];

export const EventGlyphs = () => (
  <Section
    lead='One shape per event type, used wherever an event appears: chips, the legend, pin rows and the map.'
    part={1}
    title='Event glyphs'>
    <Variants>
      <Variant caption='All nine at 12, 14 and 16, in pin. Each event keeps its shape everywhere, so colour never carries the meaning alone.'>
        <div className={styles.glyphGrid}>
          {BOARD_ORDER.map(type => (
            <div className={styles.glyphCard} key={type}>
              <span className={styles.glyphSizes}>
                {SIZES.map(size => (
                  <EventGlyph event={type} key={size} size={size} />
                ))}
              </span>
              <span className={styles.glyphName}>{NAMES[type]}</span>
            </div>
          ))}
        </div>
      </Variant>
      <Variant caption='In use · a chip (13.5), the legend (13), a pin row (14).'>
        <span className={styles.inUse}>
          <Chip glyph='marriage' on>
            Marriage
          </Chip>
          <span className={styles.legendRow}>
            <EventGlyph event='birth' size={13} /> Birth
          </span>
          <span className={styles.pinRow}>
            <EventGlyph event='marriage' size={14} />
            <span>Marriage</span>
          </span>
        </span>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        [
          'Hidden',
          <>
            Always {code('aria-hidden="true"')}; the event name is always
            written next to it.
          </>,
        ],
        [
          'Shapes',
          'Filled and open pairs (● ○, ■ □) differ in shape, not only colour, so they hold up in greyscale (NFR-06).',
        ],
      ]}
      label='Event glyphs'
      measurements={[
        ['Colour', 'pin, in every size', 'colour.pin'],
        [
          'Sizes',
          '12 · 14 · 16; in running text they take the text size (13 legend, 13.5 chips, 14 pin rows)',
          'no token',
        ],
        [
          'Font',
          'Unicode characters set in Public Sans; the browser falls back for ✚ ✱ ▼ ▲ where Public Sans lacks them',
          'font.body',
        ],
        [
          'On the map',
          'SDF icons in pin with a 2px white halo (map style board)',
          'map.pin.colour · map.pin.halo-width',
        ],
      ]}
    />
  </Section>
);

export const Legends = () => (
  <Section
    lead='"Reading the map": how borders, contested claims, uncertain dates and event types are drawn. It lives at the foot of the Layers panel.'
    part={1}
    title='Legend'>
    <Variants>
      <Variant
        caption='Desktop · bottom of the Layers tab, 288 wide (the panel less its padding). Padding 12 16, radius 12, rows 8 apart: the same at both widths.'
        desktop>
        <div className={styles.legendPanel}>
          <Legend />
        </div>
      </Variant>
      <Variant caption='Phone · full width in the Layers sheet.'>
        <div className={styles.legendSheet}>
          <Legend />
        </div>
      </Variant>
    </Variants>
    <Facts
      accessibility={[
        ['Heading', <>The overline is a real {code('h3')} in the panel.</>],
        [
          'Swatches',
          <>
            Decoration {code('(aria-hidden);')} the words say what each one
            means.
          </>,
        ],
        [
          'Colour',
          'Each meaning differs in form too: solid, dashed, striped, haloed.',
        ],
      ]}
      label='Legend'
      measurements={[
        [
          'Box',
          'padding 12 16 · radius 12 · gap 8 · surface-2, at every width',
          'space.12 · space.16 · radius.panel · space.8 · colour.surface-2',
        ],
        ['Heading', 'Overline "Reading the map"', 'type.overline'],
        [
          'Rows',
          '13 / 20 ink-2; swatch 32 wide, 12 to the words',
          'type.small · space.12',
        ],
        [
          'Line, dash',
          'border colour, 1.5 wide; the dash is 4 on, 2.6 off, as on the map',
          'map.border',
        ],
        [
          'Hatch',
          '32 × 16, radius 4, 1px border colour, 45° stripes 3 in 9 at 0.34 over the Orange Free State fill',
          'map.hatch · map.polity.free-state',
        ],
        [
          'Halo',
          'pin circle r5 at 0.6 with a 2 white stroke, in an r11 halo at 0.24',
          'map.pin · map.pin-halo',
        ],
        [
          'Glyph row',
          'Birth, Residence, Marriage, Death only; a line above, 4 above the glyphs',
          'colour.line · space.4',
        ],
      ]}
    />
  </Section>
);
