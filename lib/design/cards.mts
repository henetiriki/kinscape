/** The README and preview of each shared control's design system card (Spec #450). */

import type { Card, Docs, Prop } from '#ks/lib/design/types.ts';

import { NAMESPACE } from '#ks/lib/design/bundle.mts';
import { plainLinks } from '#ks/lib/design/system.mts';

export const GROUPS = [
  'Actions',
  'Feedback',
  'Forms',
  'Map',
  'Foundation',
  'Overlays',
  'Layout',
];

const KB = 1024;
const LINE_ONE =
  /^<!-- @dsCard group="(\w+)" height=(\d+)(?: width=(\S+))? -->$/;
const BANNED = /<(?:link|iframe|frame|object|embed|portal|noscript)\b/i;
const SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=/i;
const REST = 'The other attributes of its HTML element go to the element.';

/** The text up to its first full stop, on one line. */
export const firstSentence = (text: string): string => {
  const line = text.replace(/\s+/g, ' ').trim();

  return /^.+?[.!?](?= |$)/.exec(line)?.[0] ?? line;
};

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** The `DESIGN.md` › Components bullets whose bold text starts with each of `names`. */
export const designBullets = (design: string, names: string[]): string[] => {
  const section = design
    .split(/^(?=## )/m)
    .find(text => text.startsWith('## Components\n'));

  if (section === undefined) {
    throw new Error('DESIGN.md has no "Components" section');
  }

  const lines = section.split('\n');

  return names.map(name => {
    const bullet = new RegExp(
      `^- \\*\\*${escapeRegExp(name)}(?::\\*\\*|\\*\\*)`
    );
    const line = lines.find(each => bullet.test(each));

    if (line === undefined) {
      throw new Error(`DESIGN.md › Components has no bullet "${name}"`);
    }

    return plainLinks(line);
  });
};

const cell = (text: string): string => text.replace(/\|/g, String.raw`\|`);

const row = ({ doc, name, optional, type }: Prop): string =>
  `| \`${name}\` | \`${cell(type)}\` | ${optional ? 'no' : 'yes'} | ${cell(doc)} |`;

/** The card's README: the summary first, then the design bullets, the props and what else the element takes. */
export const controlReadme = (
  name: string,
  { forms, props, rest, summary }: Docs,
  bullets: string[]
): string => {
  if (summary === '') {
    throw new Error(`${name} has no JSDoc summary`);
  }

  const parts = [
    summary,
    bullets.length > 0 ? `## Design\n\n${bullets.join('\n')}` : '',
    props.length > 0
      ? `## Props\n\n${[
          '| Prop | Type | Required | Description |',
          '| --- | --- | --- | --- |',
          ...props.map(row),
        ].join('\n')}`
      : '',
    forms.length > 0
      ? `It takes one of these forms. Required props: ${forms
          .map(names =>
            names.length > 0
              ? names.map(each => `\`${each}\``).join(', ')
              : 'none'
          )
          .join('; or ')}.`
      : '',
    rest ? REST : '',
  ];

  return `${parts.filter(Boolean).join('\n\n')}\n`;
};

// Text in the data can't end the script or open a comment in it.
const data = (value: unknown): string =>
  JSON.stringify(value).replaceAll('<', '\\u003c');

/** The padding in px on each side of a preview's body. A card `width` includes it. */
export const PREVIEW_PAD = 16;

const STYLE = (
  pad: number,
  contain: boolean,
  frame: number | undefined,
  radios: boolean
) => `body { margin: 0; padding: ${PREVIEW_PAD}px; font-family: var(--font-body); }
#root { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px 24px; }
.ks-case { margin: 0; display: flex; flex-direction: column; gap: 8px; padding: ${pad}px 0;${contain ? ' contain: layout; width: 100%;' : ''} }
.ks-label { color: var(--ink-3); }${frame === undefined ? '' : `\n.ks-case > :last-child { height: ${frame}px; min-height: 0; }`}${radios ? '\n.ks-scope { display: contents; }' : ''}`;

const FIGURE =
  "h('figure', { className: 'ks-case', key: index }, h('figcaption', { className: 'small ks-label', id: 'ks-case-' + index }, state.label), control)";

// Radios of one name form one group only inside one form. Only a `radios` card gets a form,
// because SearchBar renders its own form and a form in a form is invalid HTML.
const CASE = (radios: boolean) =>
  radios
    ? `h('form', { className: 'ks-scope', key: index, onSubmit: function (event) { event.preventDefault(); } }, ${FIGURE})`
    : FIGURE;

/** The card's preview: a root and one script that mounts each state of `window.KinScape.<name>`. */
export const previewHtml = ({
  contain = false,
  frame,
  group,
  handlers,
  height,
  name,
  pad,
  radios = false,
  states,
  width,
}: Card): string =>
  `<!-- @dsCard group="${group}" height=${height}${width === undefined ? '' : ` width=${width}`} -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
${STYLE(pad, contain, frame, radios)}
</style>
</head>
<body>
<div id="root"></div>
<script>
(function () {
  var h = React.createElement;
  var noop = function () {};
  var Control = window.${NAMESPACE}[${data(name)}];
  var handlers = ${data(handlers)};
  var states = ${data(states)};
  var make = function (slot, key) {
    var props = Object.assign({ key: key }, slot.props);
    var part = window.${NAMESPACE}[slot.control];
    return slot.children === undefined ? h(part, props) : h(part, props, slot.children);
  };
  var items = states.map(function (state, index) {
    var props = Object.assign({ key: index }, state.props);
    handlers.forEach(function (handler) { props[handler] = noop; });
    Object.keys(state.slots || {}).forEach(function (name) { props[name] = make(state.slots[name], name); });
    var children = Array.isArray(state.children) ? state.children.map(make) : state.children;
    var control = children === undefined ? h(Control, props) : h(Control, props, children);
    return ${CASE(radios)};
  });
  ReactDOM.flushSync(function () {
    ReactDOM.createRoot(document.getElementById('root')).render(h(React.Fragment, null, items));
  });
})();
</script>
</body>
</html>
`;

/** The widths at which each card is drawn: a desktop and a phone. */
export const CARD_WIDTHS = [1440, 390];

/** The folder that holds the card images. The workflow "Design: Render snapshots" writes them. */
export const CARD_IMAGES = 'design/cards';

/** The file name, in `CARD_IMAGES`, of the image of a card at a width. */
export const cardImage = (name: string, width: number): string =>
  `${name}-${width}.png`;

/**
 * The cards that also have an image at the phone width, because the component changes with the
 * width: the 18 whose CSS has a width rule, and `Modal`, which fills the viewport. A test reads
 * the stylesheet of each `CONTROLS` entry, named for the card or for the file in its `path`.
 */
export const PHONE_CARDS = [
  'ActionBar',
  'BackLink',
  'CheckboxField',
  'Chip',
  'ColumnLayout',
  'DateField',
  'Dialog',
  'DialogPanel',
  'FuzzyDateField',
  'Modal',
  'NoticeCard',
  'PageHeader',
  'RemovableChip',
  'Sheet',
  'SheetPanel',
  'SignInLayout',
  'TextAreaField',
  'TextField',
  'Toast',
];

/** The widths of the images of a card: the desktop width, and the phone width for a card in `PHONE_CARDS`. */
export const cardImageWidths = (name: string): number[] =>
  PHONE_CARDS.includes(name) ? CARD_WIDTHS : CARD_WIDTHS.slice(0, 1);

/** Whether this is the Playwright image of the `gallery` job: the Microsoft image sets this path. */
export const pinnedImage = (env: Record<string, string | undefined>): boolean =>
  env.PLAYWRIGHT_BROWSERS_PATH === '/ms-playwright';

/** The folder that `npm run design-system` writes, and the folder in it that holds the gallery files. */
export const OUTPUT = '.design-system';
export const GALLERY = 'gallery';

/** The React 18 files that a gallery file loads: the package and its file under `umd/`. */
export const VENDOR = [
  { file: 'react.development.js', pkg: 'react-18' },
  { file: 'react-dom.development.js', pkg: 'react-dom-18' },
] as const;

const GALLERY_TAGS = [
  ...VENDOR.map(({ file }) => `<script src="vendor/${file}"></script>`),
  '<link rel="stylesheet" href="../project/tokens.css" />',
  '<link rel="stylesheet" href="../project/components/bundle.css" />',
  '<script src="../project/components/bundle.js"></script>',
].join('\n');

/**
 * The page that a browser opens from `gallery/` next to `project/`. It is the preview after its
 * card comment. Its head loads the local React, the tokens and the controls' bundle first.
 */
export const galleryHtml = (preview: string): string =>
  preview
    .slice(preview.indexOf('\n') + 1)
    .replace('<head>\n', `<head>\n${GALLERY_TAGS}\n`);

/** Throws if the README breaks a rule of the Design System type: 64 KB, and a summary first. */
export const checkReadme = (name: string, text: string): void => {
  if (text.split('\n')[0].startsWith('#') || text.startsWith('\n')) {
    throw new Error(`${name} README.md starts with a heading, not a summary`);
  }

  if (Buffer.byteLength(text) > 64 * KB) {
    throw new Error(`${name} README.md is over 64 KB`);
  }
};

/** Throws if the preview breaks a rule of the Design System type: 256 KB, line 1, and nothing linked. */
export const checkPreview = (name: string, html: string): void => {
  const [, group, height, width] = LINE_ONE.exec(html.split('\n')[0]) ?? [];
  const problem =
    Buffer.byteLength(html) > 256 * KB
      ? 'is over 256 KB'
      : !GROUPS.includes(group)
        ? 'does not start with a card comment naming one of the groups'
        : Number(height) < 40 || Number(height) > 4000
          ? 'has a height outside 40 to 4000'
          : width !== undefined &&
              !(
                /^\d+$/.test(width) &&
                Number(width) >= 320 &&
                Number(width) <= 1920
              )
            ? 'has a width that is not a whole number from 320 to 1920'
            : BANNED.test(html) || SCRIPT_SRC.test(html)
              ? 'links or embeds something'
              : undefined;

  if (problem !== undefined) {
    throw new Error(`${name} preview.html ${problem}`);
  }
};
