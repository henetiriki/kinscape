import type { DOMWindow } from 'jsdom';
import type * as ReactNamespace from 'react';

import { JSDOM, VirtualConsole } from 'jsdom';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { BOARD_DIR } from '@ks/scripts/design-export.mts';

type Page = DOMWindow & {
  KinScape: Record<string, unknown>;
  KinScapeBoard: {
    drawn: (html: string) => unknown;
    mount: (html: string) => unknown;
  };
  React: typeof ReactNamespace;
};

const SCRIPT = '<script src="./board-helpers.js"></script>';
const BUNDLE = '<script src="ds/kinscape/components/bundle.js"></script>';
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const board = (name: string) => read(`${BOARD_DIR}/${name}.dc.html`);
// The boards that call a helper.
const FRAMES = ['Map', 'Map-phone', 'Map-phone-states'];
// A board that imports one of them runs its script, so it needs the helpers in its own <head>.
const IMPORTS = new RegExp(`<dc-import name="(?:${FRAMES.join('|')})"`);
const BOARDS = [
  ...FRAMES,
  ...readdirSync(join(process.cwd(), BOARD_DIR))
    .filter(file => file.endsWith('.dc.html'))
    .map(file => file.slice(0, -'.dc.html'.length))
    .filter(name => IMPORTS.test(board(name))),
];

describe('board-helpers.js', () => {
  let page: Page;
  let h: typeof ReactNamespace.createElement;
  const Card = () => null;
  const Deep = () => null;

  // The script is a classic script that sets a global on `window`, as on a board. The page has
  // React 18 from its UMD build, which is the React that the exporter gives a board.
  beforeAll(() => {
    const dom = new JSDOM('<!doctype html>', {
      runScripts: 'outside-only',
      virtualConsole: new VirtualConsole(),
    });

    dom.window.eval(read('node_modules/react-18/umd/react.development.js'));
    dom.window.eval(read(`${BOARD_DIR}/board-helpers.js`));
    page = dom.window as Page;
    page.KinScape = { Card, Nested: { Deep } };
    h = page.React.createElement;
  });

  const mounted = (...kids: ReactNamespace.ReactNode[]) =>
    h(page.React.Fragment, null, ...kids);

  it('mount turns HTML into elements, with text, and drops a comment', () => {
    expect(
      page.KinScapeBoard.mount(
        '<p id="a" data-x-y="1" aria-label="L" accept-charset="u">Hi <b>there</b></p><!-- c -->tail'
      )
    ).toEqual(
      mounted(
        h(
          'p',
          {
            acceptCharset: 'u',
            'aria-label': 'L',
            'data-x-y': '1',
            id: 'a',
            key: 0,
          },
          'Hi ',
          h('b', { key: 1 }, 'there')
        ),
        null,
        'tail'
      )
    );
  });

  it('mount renames class, for and tabindex', () => {
    expect(
      page.KinScapeBoard.mount('<label class="c" for="f" tabindex="0"></label>')
    ).toEqual(
      mounted(
        h('label', { className: 'c', htmlFor: 'f', key: 0, tabIndex: '0' })
      )
    );
  });

  it('mount sets a boolean attribute to true, and a form value as the default', () => {
    expect(
      page.KinScapeBoard.mount(
        '<input checked disabled readonly value="v"><select value="s"></select><textarea value="t"></textarea><li value="3"></li>'
      )
    ).toEqual(
      mounted(
        h('input', {
          defaultChecked: true,
          defaultValue: 'v',
          disabled: true,
          key: 0,
          readOnly: true,
        }),
        h('select', { defaultValue: 's', key: 1 }),
        h('textarea', { defaultValue: 't', key: 2 }),
        h('li', { key: 3, value: '3' })
      )
    );
  });

  it('mount turns style text into a style object', () => {
    expect(
      page.KinScapeBoard.mount(
        '<i style="font-size: 12px; background: url(a:b) ; ;"></i>'
      )
    ).toEqual(
      mounted(
        h('i', {
          key: 0,
          style: { background: 'url(a:b)', fontSize: '12px' },
        })
      )
    );
  });

  it('mount builds an <svg> with its own attribute names', () => {
    expect(
      page.KinScapeBoard.mount(
        '<svg viewBox="0 0 24 24" stroke-width="2"><path d="M0 0"></path></svg>'
      )
    ).toEqual(
      mounted(
        h(
          'svg',
          { key: 0, strokeWidth: '2', viewBox: '0 0 24 24' },
          h('path', { d: 'M0 0', key: 0 })
        )
      )
    );
  });

  it('mount turns an <x-import> into its component and passes its attributes as they are', () => {
    expect(
      page.KinScapeBoard.mount(
        '<x-import component-from-global-scope="KinScape.Card" class="c" checked="" value="v" default-value="d" aria-label="L" style="gap: 4px"><x-import component-from-global-scope="KinScape.Nested.Deep" size="16">In</x-import></x-import>'
      )
    ).toEqual(
      mounted(
        h(
          Card,
          {
            'aria-label': 'L',
            checked: '',
            class: 'c',
            defaultValue: 'd',
            key: 0,
            style: { gap: '4px' },
            value: 'v',
          },
          h(Deep, { key: 0, size: '16' }, 'In')
        )
      )
    );
  });

  it.each(['KinScape.Nope', 'Nope.Deep'])(
    'mount throws for the unknown component %s',
    name => {
      expect(() =>
        page.KinScapeBoard.mount(
          `<x-import component-from-global-scope="${name}"></x-import>`
        )
      ).toThrow(`No component ${name}`);
    }
  );

  it('drawn mounts a raw string in a box that has no layout of its own', () => {
    expect(page.KinScapeBoard.drawn('<svg></svg>')).toEqual(
      h('div', {
        dangerouslySetInnerHTML: { __html: '<svg></svg>' },
        style: { display: 'contents' },
      })
    );
  });
});

describe('the boards that use the board helpers', () => {
  it.each(BOARDS)('%s loads the script after the bundle', name => {
    const head = board(name).split('</head>')[0];

    expect(head.split(SCRIPT)).toHaveLength(2);
    expect(head.indexOf(SCRIPT)).toBeGreaterThan(head.indexOf(BUNDLE));
    expect(head).toContain(BUNDLE);
  });

  it.each(BOARDS)('%s holds no copy of a helper', name => {
    const html = board(name);

    expect(
      html.match(/\b(?:BOOLEAN|RENAME|camel|css|drawn|el|mount)\s*=[^=]/g)
    ).toBeNull();
    expect(html).not.toContain('dangerouslySetInnerHTML');
  });
});
