/** The README and preview of each shared control's design system card (Spec #450). */

import type { Card, Docs, Prop } from './types.ts';

import { NAMESPACE } from './bundle.mts';
import { plainLinks } from './system.mts';

export const GROUPS = ['Actions', 'Feedback', 'Forms'];

const KB = 1024;
const LINE_ONE = /^<!-- @dsCard group="(\w+)" height=(\d+) -->$/;
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

const STYLE = (pad: number) => `body { margin: 0; padding: 16px; }
#root { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px 24px; }
.ks-case { margin: 0; display: flex; flex-direction: column; gap: 8px; padding: ${pad}px 0; }
.ks-label { color: var(--ink-3); }`;

/** The card's preview: a root and one script that mounts each state of `window.KinScape.<name>`. */
export const previewHtml = ({
  group,
  handlers,
  height,
  name,
  pad,
  states,
}: Card): string =>
  `<!-- @dsCard group="${group}" height=${height} -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
${STYLE(pad)}
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
  var items = states.map(function (state, index) {
    var props = Object.assign({ key: index }, state.props);
    handlers.forEach(function (handler) { props[handler] = noop; });
    var control = state.children === undefined ? h(Control, props) : h(Control, props, state.children);
    return h('figure', { className: 'ks-case', key: index }, h('figcaption', { className: 'small ks-label' }, state.label), control);
  });
  ReactDOM.flushSync(function () {
    ReactDOM.createRoot(document.getElementById('root')).render(h(React.Fragment, null, items));
  });
})();
</script>
</body>
</html>
`;

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
  const [, group, height] = LINE_ONE.exec(html.split('\n')[0]) ?? [];
  const problem =
    Buffer.byteLength(html) > 256 * KB
      ? 'is over 256 KB'
      : !GROUPS.includes(group)
        ? 'does not start with a card comment naming one of the three groups'
        : Number(height) < 40 || Number(height) > 4000
          ? 'has a height outside 40 to 4000'
          : BANNED.test(html) || SCRIPT_SRC.test(html)
            ? 'links or embeds something'
            : undefined;

  if (problem !== undefined) {
    throw new Error(`${name} preview.html ${problem}`);
  }
};
