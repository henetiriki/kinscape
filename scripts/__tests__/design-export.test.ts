import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format } from 'prettier';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CanvasSnapshot } from '../types.ts';

import {
  exportSnapshots,
  fillTemplate,
  finish,
  linkMap,
  pageHtml,
  prepare,
  readCanvasExport,
  snapshotProblems,
  tokenColours,
} from '../design-export.mts';
import { screenNames, snapshotNames } from '../design-shots.mts';

const DESKTOP = { height: 900, width: 1440 };

let root: string;

const put = (path: string, content: string) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), content);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'design-export-'));
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
  vi.restoreAllMocks();
});

describe('the real canvas export', () => {
  const canvas = readCanvasExport('.');
  const names = canvas.snapshots.map(snapshot => snapshot.name).toSorted();

  it('names the 50 snapshots of the Screens table and design/source', () => {
    expect(names).toHaveLength(50);
    expect(names).toEqual(snapshotNames('.'));
    expect(names).toEqual(
      screenNames(readFileSync('design/DESIGN.md', 'utf8')).toSorted()
    );
  });

  it('reads artboards that exist and links to snapshots that exist', () => {
    const files = [
      ...canvas.snapshots.map(snapshot => snapshot.file),
      ...Object.keys(canvas.links),
    ];

    expect(
      files.filter(file => !existsSync(join('design/canvas/project', file)))
    ).toEqual([]);
    expect(
      Object.values(canvas.links).filter(name => !names.includes(name))
    ).toEqual([]);
  });

  it('matches committed snapshots that pass the checks', () => {
    const tokens = tokenColours(readFileSync('design/tokens.json', 'utf8'));

    expect(
      names.flatMap(name =>
        snapshotProblems(
          readFileSync(`design/source/${name}.html`, 'utf8'),
          tokens
        ).map(problem => `${name}: ${problem}`)
      )
    ).toEqual([]);
  });
});

describe('linkMap', () => {
  it('links each artboard to its first plain snapshot, and the listed links', () => {
    expect(
      linkMap({
        icon: '',
        links: { 'M.dc.html': 'menu' },
        snapshots: [
          { file: 'A.dc.html', name: 'a', viewport: DESKTOP },
          { file: 'A.dc.html', name: 'a-again', viewport: DESKTOP },
          {
            file: 'B.dc.html',
            name: 'b-props',
            props: { x: 1 },
            viewport: DESKTOP,
          },
          {
            file: 'C.dc.html',
            name: 'c-state',
            state: { x: 1 },
            viewport: DESKTOP,
          },
        ],
      })
    ).toEqual({ 'A.dc.html': 'a.html', 'M.dc.html': 'menu.html' });
  });
});

describe('prepare and finish', () => {
  const urls = { fonts: 'file:///r/$&fonts.css', icon: 'file:///r/icon0.svg' };

  it('prepare drops web fonts and support.js, and loads local fonts and the icon', () => {
    expect(
      prepare(
        '<head>\n<title>T</title>\n<script src="./support.js"></script>\n</head><body><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.gstatic.com/x" rel="stylesheet"><img src="/_blob/i"><img src="/_blob/i"></body>',
        '/_blob/i',
        urls
      )
    ).toBe(
      '<head>\n<title>T</title>\n<link rel="stylesheet" href="file:///r/$&fonts.css">\n</head><body><img src="file:///r/icon0.svg"><img src="file:///r/icon0.svg"></body>'
    );
  });

  it('finish points the icon at the app and artboard links at snapshots', () => {
    expect(
      finish(
        '<img src="file:///r/icon0.svg"><a href="A.dc.html"></a><a href="B.dc.html"></a><a href="C.dc.html?x"></a>',
        urls.icon,
        { 'A.dc.html': 'a.html' }
      )
    ).toBe(
      '<img src="../../app/icon0.svg"><a href="a.html"></a><a href="B.dc.html"></a><a href="C.dc.html?x"></a>'
    );
  });
});

describe('tokenColours and snapshotProblems', () => {
  const tokens = tokenColours(
    '{ "a": "#264f29", "b": "#FFF", "c": "rgb(24 33 27 / 0.45)" }'
  );

  it('reads hex and rgb token colours', () => {
    expect(tokens).toEqual(new Set(['24,33,27', '255,255,255', '38,79,41']));
  });

  it('passes token colours in any form', () => {
    expect(
      snapshotProblems(
        '<p style="color: #264F29; background: rgba(24, 33, 27, 0.5); border-color: #ffffff">',
        tokens
      )
    ).toEqual([]);
  });

  it('names each colour that is not a token, once', () => {
    expect(
      snapshotProblems(
        '<p style="color: #123456; fill: #123456; stroke: rgb(1, 2, 3)">',
        tokens
      )
    ).toEqual([
      '#123456 is not in design/tokens.json',
      'rgb(1, 2, 3) is not in design/tokens.json',
    ]);
  });

  it.each([
    ['var(', '<i style="color: var(--x)">'],
    ['calc(', '<i style="width: calc(1px + 2px)">'],
    ['<script', '<script>x</script>'],
    ['{{', '<i>{{ x }}</i>'],
    ['_blob', '<img src="/_blob/i">'],
    ['http://', '<a href="http://x.test">'],
    ['https://', '<a href="https://x.test">'],
    ['.dc.html', '<a href="A.dc.html">'],
  ])('rejects %s', (label, html) => {
    expect(snapshotProblems(html, tokens)).toEqual([`contains ${label}`]);
  });
});

describe('fillTemplate', () => {
  const COMPONENT = `class Component extends DCLogic {
  constructor(props) { super(props); this.state = { kept: 'k', no: true }; }
  renderVals() { return { ...this.props, ...this.state }; }
}`;

  const artboard = (body: string, script = COMPONENT, props?: string) => {
    document.head.innerHTML = '<title>T</title>';
    document.body.innerHTML = `<x-dc>${body}</x-dc><script type="text/x-dc" data-dc-script${props === undefined ? '' : ` data-props='${props}'`}>${script}</script>`;
  };

  const filled = () => document.querySelector('x-dc')?.innerHTML;

  it('fills text, attributes, loops and conditions from renderVals', () => {
    artboard(
      [
        '<helmet><style>p{}</style></helmet>',
        '<p title="{{ title }}" class="a {{ kept }}">Hi {{ who.name }}{{ missing.deep }}!</p><p>plain</p><!-- note -->',
        '<sc-for list="{{ items }}" as="row"><i>{{ $index }}:{{ row }}</i></sc-for>',
        '<sc-for list="{{ items }}"><b>{{ item }}</b></sc-for>',
        '<sc-for list="{{ none }}"><u>x</u></sc-for>',
        '<sc-if value="{{ yes }}"><em>{{ title }}</em></sc-if>',
        '<sc-if value="{{ false }}"><s>gone</s></sc-if>',
        '<input checked="{{ true }}" disabled="{{ no }}" onclick="{{ go }}" onchange="keep()">',
      ].join(''),
      COMPONENT,
      '{"title":{"default":"Ti"},"who":{"default":{"name":"Ann"}},"items":{"default":["z"]},"$preview":{"default":1},"flag":{"editor":"boolean"}}'
    );

    fillTemplate({
      props: { items: ['a', 'b'], yes: true },
      state: { no: false },
    });

    expect(document.head.innerHTML).toBe('<title>T</title><style>p{}</style>');
    expect(filled()).toBe(
      [
        '<p title="Ti" class="a k">Hi Ann!</p><p>plain</p><!-- note -->',
        '<i>0:a</i><i>1:b</i>',
        '<b>a</b><b>b</b>',
        '<em>Ti</em>',
        '<input checked="" onchange="keep()">',
      ].join('')
    );
  });

  it('works without prop definitions or a helmet', () => {
    artboard(
      '<p>{{ a }}</p>',
      'class Component extends DCLogic { renderVals() { return this.props; } }'
    );

    fillTemplate({ props: { a: 1 }, state: {} });

    expect(document.head.innerHTML).toBe('<title>T</title>');
    expect(filled()).toBe('<p>1</p>');
  });

  it('rejects a page that is not an artboard', () => {
    document.body.innerHTML = '<p>x</p>';

    expect(() => fillTemplate({ props: {}, state: {} })).toThrow(
      'Not a canvas artboard'
    );
  });

  it('rejects a script with no Component', () => {
    artboard('<p>x</p>', 'class Other {}');

    expect(() => fillTemplate({ props: {}, state: {} })).toThrow(
      'The artboard script defines no Component'
    );
  });

  it.each([
    ['<sc-if value="yes"><p>x</p></sc-if>', '<sc-if value>'],
    ['<sc-for><p>x</p></sc-for>', '<sc-for list>'],
  ])('rejects %s without one binding', (body, label) => {
    artboard(body);

    expect(() => fillTemplate({ props: {}, state: {} })).toThrow(
      `${label} needs one {{…}} binding`
    );
  });
});

describe('pageHtml', () => {
  it('strips scripts and links, unwraps x-dc, resolves calc() and loads fonts.css', () => {
    document.head.innerHTML =
      '<title>T</title><link rel="stylesheet" href="x.css"><script>1</script>';
    document.body.innerHTML =
      '<x-dc><p style="width: calc(10px + 20px)">A</p><i style="color: red">B</i></x-dc><script type="text/x-dc"></script>';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '30px',
    } as unknown as CSSStyleDeclaration);

    expect(pageHtml()).toBe(
      '<!doctype html>\n<html><head><title>T</title><link rel="stylesheet" href="fonts.css"></head><body><p style="width: 30px;">A</p><i style="color: red">B</i></body></html>\n'
    );
  });

  it('rejects a page without a title', () => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    expect(() => pageHtml()).toThrow('The artboard has no <title>');
  });
});

describe('exportSnapshots', () => {
  const snapshots: CanvasSnapshot[] = [
    { file: 'A.dc.html', name: 'a', viewport: DESKTOP },
    { file: 'B.dc.html', name: 'b', viewport: DESKTOP },
  ];

  const page = (body: string) =>
    `<!doctype html>\n<html><head><title>T</title></head><body>${body}</body></html>\n`;

  const setup = (a = '<p style="color: #18211b">A</p>') => {
    put(
      'design/canvas/export.json',
      JSON.stringify({ icon: '/_blob/i', links: {}, snapshots })
    );
    put('design/canvas/project/A.dc.html', `<img src="/_blob/i">${a}`);
    put('design/canvas/project/B.dc.html', '<a href="A.dc.html">A</a>');
    put('design/tokens.json', '{ "ink": "#18211b" }');
    put('.prettierrc.json', '{ "useTabs": true }');
  };

  const expected = async (body: string) =>
    format(page(body), { filepath: 'x.html', useTabs: true });

  const render = vi.fn(async (html: string) => page(html));

  it('writes each snapshot, formatted with the root Prettier config', async () => {
    setup();

    const icon = pathToFileURL(resolve(root, 'app/icon0.svg')).href;

    expect(await exportSnapshots(root, [], { render })).toEqual(['a', 'b']);
    expect(render).toHaveBeenCalledWith(
      `<img src="${icon}"><p style="color: #18211b">A</p>`,
      snapshots[0]
    );
    expect(readFileSync(join(root, 'design/source/a.html'), 'utf8')).toBe(
      await expected(
        '<img src="../../app/icon0.svg"><p style="color: #18211b">A</p>'
      )
    );
    expect(readFileSync(join(root, 'design/source/b.html'), 'utf8')).toBe(
      await expected('<a href="a.html">A</a>')
    );
  });

  it('returns only the snapshots whose bytes changed', async () => {
    setup();
    put('design/source/b.html', await expected('<a href="a.html">A</a>'));

    expect(await exportSnapshots(root, [], { render })).toEqual(['a']);
  });

  it('exports only the named snapshots', async () => {
    setup();

    const only = vi.fn(async (html: string) => page(html));

    expect(await exportSnapshots(root, ['b'], { render: only })).toEqual(['b']);
    expect(only).toHaveBeenCalledOnce();
  });

  it('rejects a name with no snapshot', async () => {
    setup();

    await expect(exportSnapshots(root, ['c', 'a'], { render })).rejects.toThrow(
      'No snapshot named: c'
    );
  });

  it('writes nothing and names the artboard and colour when a colour is not a token', async () => {
    setup('<p style="color: #123456">A</p>');

    await expect(exportSnapshots(root, [], { render })).rejects.toThrow(
      'A.dc.html → a.html: #123456 is not in design/tokens.json'
    );
    expect(existsSync(join(root, 'design/source'))).toBe(false);
  });
});
