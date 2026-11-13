import type { ReactNode } from 'react';

import { ActionBar } from '@ks/app/components/actions/ActionBar';
import { Button } from '@ks/app/components/actions/Button';
import { Avatar } from '@ks/app/components/foundation/Avatar';
import { BackLink, PageHeader } from '@ks/app/components/foundation/PageHeader';
import {
  ByViewport,
  code,
  Facts,
  LINK_COLUMNS,
  Matrix,
  Section,
  stateOf,
} from '@ks/app/design-kit/inputs/Board';

import styles from '@ks/app/design-kit/inputs/page.module.css';

// The samples link to a page that exists; a click on one is not part of the board.
const HREF = '/';

/** A sample with the line that says what it shows. */
const Shot = ({
  caption,
  children,
}: {
  caption: ReactNode;
  children: ReactNode;
}) => (
  <figure className={styles.shot}>
    {children}
    <figcaption className={styles.shotCaption}>{caption}</figcaption>
  </figure>
);

const HeaderShot = ({
  backLabel,
  caption,
}: {
  backLabel: string;
  caption: ReactNode;
}) => (
  <Shot caption={caption}>
    <div className={styles.frame}>
      <PageHeader
        avatar={<Avatar initial='L' />}
        backHref={HREF}
        backLabel={backLabel}
      />
      <div className={styles.frameFoot} />
    </div>
  </Shot>
);

export const PageHeaderSection = () => (
  <Section
    lead='The bar at the top of every page away from the map: the Wordmark, a divider, a link back to the page above, and the Avatar at the right. Drawn by hand: the design system has no PageHeader yet.'
    part={2}
    phoneLead='The bar at the top of every page away from the map: the Wordmark icon, a link back to the page above, and the Avatar at the right. Drawn by hand: the design system has no PageHeader yet.'
    title='Page header'>
    <div className={styles.stack}>
      <HeaderShot
        backLabel='Map'
        caption={
          <ByViewport
            desktop='Back to Map · the people list. 64 tall, white, 1px line below: Wordmark 32, a 1 × 28 divider, the back link, and the Avatar at the right. The bar, the divider and the back link are drawn by hand; the Wordmark, the back icon and the Avatar are the real components.'
            phone='Back to Map · the people list. 60 tall, white, 1px line below: the Wordmark icon at 32, the back link and the Avatar, 8 apart, 16 from the sides. No divider. The bar and the back link are drawn by hand; the Wordmark, the back icon and the Avatar are the real components.'
          />
        }
      />
      <HeaderShot
        backLabel='People'
        caption="Back to People · a person's page. The same bar: only the back text and where it goes change."
      />
    </div>
    <Facts
      accessibility={[
        [
          'Role',
          <>
            A {code('header')}at the top of the page. The divider is{' '}
            {code('aria-hidden.')}
          </>,
        ],
        [
          'Order',
          'Wordmark, back link, Avatar: the reading and Tab order follow the bar from the left.',
        ],
        [
          'Avatar',
          'The real Avatar. It opens the account menu, as on the map.',
        ],
      ]}
      label='Page header'
      measurements={[
        [
          'Height',
          '64 · 60 on a phone',
          'layout.page-header · layout.page-header-phone',
        ],
        [
          'Padding',
          '0 24 · 0 16 on a phone',
          'size.gutter · size.gutter-phone',
        ],
        ['Gap', '16 between the parts · 8 on a phone', 'space.16 · space.8'],
        ['Wordmark', '32 · the icon alone on a phone', 'Wordmark size 32'],
        ['Divider', '1 × 28, line · none on a phone', 'colour.line'],
        ['Surface', 'white, 1px line below', 'colour.surface · colour.line'],
      ]}
    />
  </Section>
);

export const BackLinkSection = () => (
  <Section
    lead='Goes up one level: from People to the map, from a person to People. It is a link, so it can open in a new tab. Its states come from IconButton and the focus ring: no new colour.'
    part={2}
    title='Back link'>
    <Matrix
      columns={LINK_COLUMNS}
      label='Back link states'
      note="Drawn by hand with the real back Icon. Hover and pressed are IconButton's; focus is the ring every control uses."
      rows={[
        {
          hint: '44, in the page header',
          inert: true,
          name: 'Back link',
          render: column => (
            <BackLink href={HREF} label='Map' state={stateOf(column)} />
          ),
        },
        {
          hint: "On a person's page",
          inert: true,
          name: 'Back link',
          render: column => (
            <BackLink href={HREF} label='People' state={stateOf(column)} />
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            A real {code('a')}with the {code('href')}of the page above. An
            anchor, so the browser loads that page.
          </>,
        ],
        [
          'Name',
          <>
            The visible text, Map or People. The icon is {code('aria-hidden.')}
          </>,
        ],
        [
          'Keyboard',
          <>
            Tab to reach, Enter to follow. Focus shows the ring only on{' '}
            {code(':focus-visible.')}
          </>,
        ],
      ]}
      label='Back link'
      measurements={[
        ['Height', '44, the touch size', 'size.touch'],
        ['Padding', '0 12 0 8', 'space.12 · space.8'],
        [
          'Icon',
          'back, 16, 8 from the text, the colour of the text',
          'space.8',
        ],
        ['Label', '15 / 22 · 600 · ink', 'type.control · colour.ink'],
        ['Radius', '8', 'radius.control'],
        ['Hover', 'surface-2 behind, as IconButton', 'colour.surface-2'],
        [
          'Pressed',
          'brand-tint behind, brand-hover text and icon, as IconButton',
          'colour.brand-tint · colour.brand-hover',
        ],
        [
          'Focus',
          '2px outline, 2px outside',
          'focus.width · focus.offset · colour.focus-ring',
        ],
      ]}
    />
  </Section>
);

export const ActionBarSection = () => (
  <Section
    lead='The row of buttons that saves or leaves a form page: the primary button, then the secondary one. It stays at the bottom of the window while the form scrolls under it. Drawn by hand: the design system has no ActionBar yet.'
    part={2}
    phoneLead='The row of buttons that saves or leaves a form page: the primary button, then the secondary one, side by side as on desktop. No phone screen uses it yet: the person form on a phone has no Save or Cancel today. Drawn by hand: the design system has no ActionBar yet.'
    title='Action bar'>
    <Shot
      caption={
        <ByViewport
          desktop='Fixed to the bottom of the window: the page scrolls under it. 72 tall, white, 1px line above. Save, then Cancel, 8 apart, in a row up to 1088 wide, centred, with 24 at each side. The bar is drawn by hand; the buttons are the real Button.'
          phone='Fixed to the bottom of the window: the page scrolls under it. 72 tall, white, 1px line above, then the safe area of the device added below the 72 (34 on this sample, none on a phone without one). Save, then Cancel, 8 apart, at their own width: 12 from the top of the bar and 16 from the side. The bar is drawn by hand; the buttons are the real Button.'
        />
      }>
      <div className={styles.barStage}>
        <span className={styles.barLabel}>Bottom of the window</span>
        <div className={styles.barBox}>
          <ActionBar>
            <Button variant='primary'>Save</Button>
            <Button href={HREF}>Cancel</Button>
          </ActionBar>
        </div>
        <div className={styles.safeArea}>
          <span>Safe area of the device</span>
        </div>
      </div>
    </Shot>
    <Facts
      accessibility={[
        ['Order', 'Save, then Cancel, in reading and Tab order.'],
        [
          'Save',
          <>
            {code('type="submit"')}with a {code('form')}attribute, because the
            bar sits outside the form.
          </>,
        ],
        ['Cancel', 'A link to the page above: the button as a link.'],
        [
          'Space',
          'The page keeps 72 free at its foot, so the last field can scroll above the bar.',
        ],
      ]}
      label='Action bar'
      measurements={[
        [
          'Height',
          '72 · a phone adds the safe area of the device below',
          'layout.action-bar',
        ],
        [
          'Row',
          'up to 1088 wide, centred, 24 at each side · on a phone 12 above the buttons and 16 at each side, buttons at the top',
          'size.gutter · space.12 · size.gutter-phone',
        ],
        [
          'Buttons',
          'M 44, primary then secondary, 8 apart',
          'size.control · space.8',
        ],
        [
          'Surface',
          'white, 1px line above, above the page',
          'colour.surface · colour.line · z.action-bar',
        ],
      ]}
    />
  </Section>
);

export const ButtonLinks = () => (
  <Section
    lead={
      <>
        With an {code('href')}a button is a link: the same look and states, no
        underline, and no disabled state, because a link can&apos;t be disabled.
        Use it when pressing goes to another page, like Cancel on a form. Drawn
        by hand: the design system&apos;s Button can&apos;t be a link yet.
      </>
    }
    part={1}
    title='Button as a link'>
    <Matrix
      columns={LINK_COLUMNS}
      label='Button link states'
      note={
        <ByViewport
          desktop='Drawn by hand: the link form is not in the design system yet. It copies the real Button exactly. No disabled column: a link has no disabled state.'
          phone='Drawn by hand: the link form is not in the design system yet. It copies the real Button exactly. No disabled state: a link has none.'
        />
      }
      rows={[
        {
          hint: 'M 44 · a page action',
          inert: true,
          name: 'Primary',
          render: column => (
            <Button href={HREF} state={stateOf(column)} variant='primary'>
              Add a person
            </Button>
          ),
        },
        {
          hint: 'M 44 · Cancel in the action bar',
          inert: true,
          name: 'Secondary',
          render: column => (
            <Button href={HREF} state={stateOf(column)}>
              Cancel
            </Button>
          ),
        },
        {
          hint: 'S 40 · a notice card action',
          inert: true,
          name: 'Primary, card',
          phoneHint: 'M 44 on a phone · a notice card action',
          render: column => (
            <span className={styles.cardButton}>
              <Button
                href={HREF}
                size='s'
                state={stateOf(column)}
                variant='primary'>
                See all people
              </Button>
            </span>
          ),
        },
      ]}
    />
    <Facts
      accessibility={[
        [
          'Role',
          <>
            A real {code('a')}with an {code('href,')}not a {code('button.')}
          </>,
        ],
        ['Name', 'The visible label.'],
        [
          'Keyboard',
          'Tab to reach, Enter to follow. Space scrolls the page, as on any link.',
        ],
      ]}
      label='Button as a link'
      measurements={[
        [
          'Height',
          'M 44 · S 40 inside desktop cards (M 44 on a phone)',
          'size.control · size.control-s',
        ],
        ['Padding', '0 16', 'space.16'],
        [
          'Label',
          'M 15 / 22 · S 14 / 20, all 600, no underline',
          'type.control · type.button-s',
        ],
        [
          'States',
          "the Button's: hover, focus ring, pressed",
          'colour.brand-hover · colour.brand-pressed · colour.brand-tint',
        ],
        ['Disabled', 'none: a link is never disabled', '—'],
      ]}
    />
  </Section>
);
