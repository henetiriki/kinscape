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
  inlineStyles,
  linkMap,
  mountImports,
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

  it('names the 52 snapshots of the Screens table and design/source', () => {
    expect(names).toHaveLength(52);
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

  it('prepare loads a design system from files: React 18, its CSS as a style and its scripts', () => {
    const system = {
      css: '.a { color: $& }',
      design: 'file:///d/$&/',
      react: 'file:///r/react.js',
      reactDom: 'file:///r/react-dom.js',
    };

    expect(
      prepare(
        [
          '<script src="./support.js"></script>',
          '<link rel="stylesheet" href="ds/kinscape/tokens.css">',
          '<link rel="stylesheet" href="ds/kinscape/components/bundle.css">',
          '<script src="ds/kinscape/components/bundle.js"></script>',
        ].join(''),
        '/_blob/i',
        { ...urls, system }
      )
    ).toBe(
      [
        `<link rel="stylesheet" href="${urls.fonts}">`,
        '<link rel="stylesheet" href="file:///d/$&/tokens.css">',
        '<style data-bundle>.a { color: $& }</style>',
        '<script src="file:///r/react.js"></script>',
        '<script src="file:///r/react-dom.js"></script>',
        '<script src="file:///d/$&/components/bundle.js"></script>',
      ].join('')
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

  it('checks 4- and 8-digit hex on their colour digits, ignoring alpha', () => {
    expect(
      snapshotProblems(
        '<i fill="#264f2980"></i><i fill="#fffa"></i><i fill="#12345678"></i><i fill="#1234"></i>',
        tokens
      )
    ).toEqual([
      '#12345678 is not in design/tokens.json',
      '#1234 is not in design/tokens.json',
    ]);
  });

  it('reports rgb() colours it cannot read as integers', () => {
    expect(
      snapshotProblems(
        '<i style="color: rgb(100% 0% 0%); fill: rgba(255.5, 0, 0, 1); stroke: rgb(24 33 27)">',
        tokens
      )
    ).toEqual([
      'rgb(100% 0% 0%) cannot be read as a colour',
      'rgba(255.5, 0, 0, 1) cannot be read as a colour',
    ]);
  });

  it('names colour keywords in any declaration, whatever the property', () => {
    expect(
      snapshotProblems(
        '<i style="accent-color: green; text-decoration: underline red; background-image: linear-gradient(white, #264F29); column-rule: 1px solid gold; scrollbar-color: navy tan; -webkit-text-fill-color: pink"></i><style>b{border-image: linear-gradient(plum, plum) 1}</style><b stop-color="Ivory" flood-color="snow" lighting-color="peru"></b>',
        tokens
      )
    ).toEqual([
      'green is not in design/tokens.json',
      'red is not in design/tokens.json',
      'white is not in design/tokens.json',
      'gold is not in design/tokens.json',
      'navy is not in design/tokens.json',
      'tan is not in design/tokens.json',
      'pink is not in design/tokens.json',
      'plum is not in design/tokens.json',
      'Ivory is not in design/tokens.json',
      'snow is not in design/tokens.json',
      'peru is not in design/tokens.json',
    ]);
  });

  it('names the SVG color and HTML bgcolor attributes', () => {
    expect(
      snapshotProblems(
        '<svg color="red"><path fill="currentColor"></path></svg><table bgcolor="Teal"></table>',
        tokens
      )
    ).toEqual([
      'red is not in design/tokens.json',
      'Teal is not in design/tokens.json',
    ]);
  });

  it('names CSS system colours', () => {
    expect(
      snapshotProblems(
        '<i style="color: CanvasText; background: Canvas; border-color: LinkText"></i><b fill="Highlight"></b>',
        tokens
      )
    ).toEqual([
      'CanvasText is not in design/tokens.json',
      'Canvas is not in design/tokens.json',
      'LinkText is not in design/tokens.json',
      'Highlight is not in design/tokens.json',
    ]);
  });

  it('does not read page text as CSS', () => {
    expect(
      snapshotProblems('<p>Primary: brand, white text. Note: red</p>', tokens)
    ).toEqual([]);
  });

  it('does not read text and reference attributes', () => {
    expect(
      snapshotProblems(
        '<nav aria-label="Orange menu" role="menu" id="red" data-note="white text"><input type="text" title="White" value="Orange Free State"></nav>',
        tokens
      )
    ).toEqual([]);
  });

  it('names colour keywords in style declarations and fill/stroke, not none or currentColor', () => {
    expect(
      snapshotProblems(
        '<i style="color: red; border: 1px solid White; background: url(a.svg)"><b fill="none" stroke="currentColor"></b><b fill="Teal"></b><b style="background: transparent; border-bottom: 1px solid #264F29"></b></i>',
        tokens
      )
    ).toEqual([
      'red is not in design/tokens.json',
      'White is not in design/tokens.json',
      'uses url(), which the colour check cannot read',
      'Teal is not in design/tokens.json',
    ]);
  });

  it('names any function it cannot read, in CSS or an attribute, but passes url(#id)', () => {
    expect(
      snapshotProblems(
        '<i style="color: hsl(0 0% 0%); fill: url(#a); background: light-dark(#fff, #fff)"></i><b fill="url(#b) none" stroke="color-mix(in srgb, #fff, #264f29)"></b><style>b{color: oklch(0.5 0.1 20)}</style>',
        tokens
      )
    ).toEqual([
      'stroke="color-mix(in srgb, #fff, #264f29)" cannot be read as a colour',
      'uses hsl(), which the colour check cannot read',
      'uses light-dark(), which the colour check cannot read',
      'uses color-mix(), which the colour check cannot read',
      'uses oklch(), which the colour check cannot read',
    ]);
  });

  it('reports a colour attribute whose value it cannot read, as legacy HTML makes a colour of any text', () => {
    expect(
      snapshotProblems(
        '<body text="chucknorris" link="ff0000"><table bordercolor="#12345"></table><i fill="#264f29" vlink="Navy"></i></body>',
        tokens
      )
    ).toEqual([
      'text="chucknorris" cannot be read as a colour',
      'link="ff0000" cannot be read as a colour',
      'bordercolor="#12345" cannot be read as a colour',
      'Navy is not in design/tokens.json',
    ]);
  });

  it('names colour keywords in any attribute, Background, Menu and -webkit- colours', () => {
    expect(
      snapshotProblems(
        '<animate to="red" values="#264f29;blue"></animate><i style="color: Background; border-color: -webkit-link"></i><b fill="Menu"></b>',
        tokens
      )
    ).toEqual([
      'red is not in design/tokens.json',
      'blue is not in design/tokens.json',
      'Background is not in design/tokens.json',
      '-webkit-link is not in design/tokens.json',
      'Menu is not in design/tokens.json',
    ]);
  });

  it('reads legacy HTML colour attributes as legacy HTML does', () => {
    expect(
      snapshotProblems(
        '<body bgcolor="#264F29" text="transparent"><td bgcolor="none"></td><td bgcolor="rgb(38, 79, 41)"></td><font color="#264f2980"></font><path fill="inherit"></path></body>',
        tokens
      )
    ).toEqual([
      'bgcolor="none" cannot be read as a colour',
      'bgcolor="rgb(38, 79, 41)" cannot be read as a colour',
      'color="#264f2980" cannot be read as a colour',
    ]);
  });

  it('reads style-block declarations, not selectors, and rejects @import', () => {
    expect(
      snapshotProblems(
        '<style>@import "a.css"; li:nth-child(2) mark{color: #264f29}@media (min-width: 1px){a:hover{color: red; transform: translate3d(0, 0, 0)}}</style>',
        tokens
      )
    ).toEqual([
      'contains @import',
      'red is not in design/tokens.json',
      'uses translate3d(), which the colour check cannot read',
    ]);
  });

  it('reads single-quoted attributes, as Prettier writes them', () => {
    expect(
      snapshotProblems(
        `<i style='font-family: "A"; color: red'></i><i fill='teal'></i><i bgcolor='none'></i><i title='red'></i>`,
        tokens
      )
    ).toEqual([
      "bgcolor='none' cannot be read as a colour",
      'red is not in design/tokens.json',
      'teal is not in design/tokens.json',
    ]);
  });

  it('reads declarations beside a nested rule', () => {
    expect(
      snapshotProblems(
        '<style>.a{color: red; &:hover{color: #264f29} background: oklch(1 0 0)}</style>',
        tokens
      )
    ).toEqual([
      'red is not in design/tokens.json',
      'uses oklch(), which the colour check cannot read',
    ]);
  });

  it('reports a CSS escape, which can spell a colour', () => {
    expect(snapshotProblems('<i style="color: r\\65 d"></i>', tokens)).toEqual([
      'r\\65 d uses a CSS escape, which the colour check cannot read',
    ]);
  });

  it.each([
    ['var(', '<i style="color: var(--x)">'],
    ['calc(', '<i style="width: calc(1px + 2px)">'],
    ['<script', '<script>x</script>'],
    ['x-import', '<x-import></x-import>'],
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

  it("keeps each <x-import>'s props as values, with kebab-case names in camelCase", () => {
    artboard(
      [
        '<x-import component-from-global-scope="K.B" variant="primary" default-value="v" aria-label="Go" data-id="a {{ who }}" on-toggle="{{ go }}" options="{{ opts }}" day="{{ n }}" full="{{ yes }}" style="flex: 1">Save {{ who }}</x-import>',
        '<x-import component-from-global-scope="K.G"><x-import component-from-global-scope="K.I" n="{{ n }}"></x-import></x-import>',
      ].join('')
    );

    const go = () => {};

    fillTemplate({
      props: { go, n: 5, opts: [{ a: 1 }], who: 'Ann', yes: true },
      state: {},
    });

    const [first, group, item] = Array.from(
      document.querySelectorAll('x-import')
    ) as unknown as {
      getAttribute: (name: string) => string;
      props: object;
      textContent: string;
    }[];

    expect(first.props).toEqual({
      'aria-label': 'Go',
      'data-id': 'a Ann',
      day: 5,
      defaultValue: 'v',
      full: true,
      onToggle: go,
      options: [{ a: 1 }],
      variant: 'primary',
    });
    expect(first.getAttribute('options')).toBe('{{ opts }}');
    expect(first.textContent).toBe('Save Ann');
    expect(group.props).toEqual({});
    expect(item.props).toEqual({ n: 5 });
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

describe('mountImports', () => {
  type Tree = {
    children: unknown[];
    component: (props: Record<string, unknown>) => Node;
    props: Record<string, unknown>;
  };

  const draw = (tree: unknown): Node =>
    typeof tree === 'string'
      ? document.createTextNode(tree)
      : (tree as Tree).component({
          ...(tree as Tree).props,
          children: (tree as Tree).children.map(draw),
        });

  const box = (tag: string, props: Record<string, unknown>) => {
    const element = document.createElement(tag);

    if (typeof props.variant === 'string') {
      element.dataset.variant = props.variant;
    }

    element.append(...(props.children as Node[]));

    return element;
  };

  const board = (body: string) => {
    document.head.innerHTML = '<title>T</title>';
    document.body.innerHTML = `<x-dc>${body}</x-dc><script type="text/x-dc" data-dc-script>class Component extends DCLogic { renderVals() { return {}; } }</script>`;
    fillTemplate({ props: {}, state: {} });
  };

  const install = () =>
    Object.assign(window, {
      KinScape: {
        Button: (props: Record<string, unknown>) => box('button', props),
        Group: Object.assign(
          (props: Record<string, unknown>) => box('ul', props),
          { Item: (props: Record<string, unknown>) => box('li', props) }
        ),
      },
      React: {
        createElement: (
          component: unknown,
          props: unknown,
          ...children: unknown[]
        ) => ({ children, component, props }),
      },
      ReactDOM: {
        createRoot: (container: Element) => ({
          render: (tree: unknown) => container.replaceChildren(draw(tree)),
        }),
        flushSync: (run: () => void) => run(),
      },
    });

  afterEach(() => {
    for (const name of ['KinScape', 'React', 'ReactDOM']) {
      delete (window as unknown as Record<string, unknown>)[name];
    }
  });

  it('renders each top-level <x-import> with its props and children, nested ones too', async () => {
    install();
    board(
      [
        '<x-import component-from-global-scope="KinScape.Button" variant="primary">Save pin</x-import>',
        '<x-import component-from-global-scope="KinScape.Group">\n  <x-import component-from-global-scope="KinScape.Group.Item">One</x-import>\n</x-import>',
      ].join('')
    );

    await mountImports();

    expect(document.querySelector('button')?.outerHTML).toBe(
      '<button data-variant="primary">Save pin</button>'
    );
    expect(document.querySelector('ul')?.outerHTML).toBe(
      '<ul><li>One</li></ul>'
    );
    expect(document.querySelectorAll('li')).toHaveLength(1);
  });

  it('does nothing on a board with no <x-import>, needing no React', async () => {
    board('<p>x</p>');

    await expect(mountImports()).resolves.toBeUndefined();
  });

  it('rejects when React 18 is not loaded', async () => {
    board(
      '<x-import component-from-global-scope="KinScape.Button"></x-import>'
    );

    await expect(mountImports()).rejects.toThrow('React 18 is not loaded');
  });

  it('rejects a component the page does not define', async () => {
    install();
    board('<x-import component-from-global-scope="Nope.Deep"></x-import>');

    await expect(mountImports()).rejects.toThrow('No component Nope.Deep');
  });

  it('rejects markup inside an <x-import>', async () => {
    install();
    board(
      '<x-import component-from-global-scope="KinScape.Button"><b>x</b></x-import>'
    );

    await expect(mountImports()).rejects.toThrow(
      'Unsupported <b> inside <x-import>'
    );
  });
});

describe('inlineStyles', () => {
  it('writes the computed values of the declared properties onto every element a rule matches, then drops the stylesheet', () => {
    document.head.innerHTML =
      '<title>T</title><style data-bundle>@font-face{font-family:f}:root{--x:1px}.a{width:1px;margin-top:0;transition-property:width;border-top-color:red}@media (min-width:1px){.a{padding-top:1px}}.b:hover{height:1px}.c{--y:2px}</style>';
    document.body.innerHTML =
      '<p class="a">out</p><x-import><i class="a"><u class="b"></u></i><s class="c"></s></x-import>';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) =>
        name === 'border-top-color' ? 'rgba(0, 0, 0, 0)' : '5px',
    } as unknown as CSSStyleDeclaration);

    inlineStyles();

    expect(document.body.innerHTML).toBe(
      '<p class="a" style="width: 5px; margin-top: 5px; border-top-color: transparent; padding-top: 5px;">out</p><x-import><i class="a" style="width: 5px; margin-top: 5px; border-top-color: transparent; padding-top: 5px;"><u class="b"></u></i><s class="c"></s></x-import>'
    );
    expect(document.querySelector('style')).toBeNull();
  });

  it('does nothing without the stylesheet', () => {
    document.head.innerHTML = '<title>T</title>';
    document.body.innerHTML = '<x-import><i></i></x-import>';

    inlineStyles();

    expect(document.body.innerHTML).toBe('<x-import><i></i></x-import>');
  });
});

describe('pageHtml', () => {
  it("writes var() in style attributes out as the root's values, then resolves calc()", () => {
    document.head.innerHTML = '<title>T</title>';
    document.body.innerHTML =
      '<x-dc><p style="margin-top: var(--gap); width: calc(var(--gap) + 32px)">A</p></x-dc>';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => (name === '--gap' ? ' 8px ' : '40px'),
    } as unknown as CSSStyleDeclaration);

    expect(pageHtml()).toBe(
      '<!doctype html>\n<html><head><title>T</title><link rel="stylesheet" href="fonts.css"></head><body><p style="margin-top: 8px; width: 40px;">A</p></body></html>\n'
    );
  });

  it('unwraps <x-import>, keeping a box for the one that places its slot', () => {
    document.head.innerHTML = '<title>T</title>';
    document.body.innerHTML =
      '<x-dc><x-import component-from-global-scope="K.B"><b>A</b></x-import><x-import style="width: 5px"><i>B</i></x-import></x-dc>';

    expect(pageHtml()).toBe(
      '<!doctype html>\n<html><head><title>T</title><link rel="stylesheet" href="fonts.css"></head><body><b>A</b><div style="width: 5px;"><i>B</i></div></body></html>\n'
    );
  });

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

  it('loads the design system from files for a board that uses <x-import>', async () => {
    setup();
    put(
      'design/canvas/project/A.dc.html',
      '<link rel="stylesheet" href="ds/kinscape/components/bundle.css"><script src="ds/kinscape/components/bundle.js"></script><x-import component-from-global-scope="K.B"></x-import>'
    );
    put('design/canvas/project/ds/kinscape/components/bundle.css', '.a{}');
    put(
      'design/canvas/project/ds/kinscape/tokens.css',
      '@font-face{font-family:f;src:url(f.woff2)}.t{color:red}'
    );

    const seen = vi.fn();
    const url = (path: string) => pathToFileURL(resolve(root, path)).href;

    await exportSnapshots(root, ['a'], {
      render: async html => {
        seen(html);

        return page('<p style="color: #18211b">A</p>');
      },
    });

    expect(seen).toHaveBeenCalledWith(
      [
        '<style data-bundle>.t{color:red}\n.a{}</style>',
        `<script src="${url('node_modules/react-18/umd/react.production.min.js')}"></script>`,
        `<script src="${url('node_modules/react-dom-18/umd/react-dom.production.min.js')}"></script>`,
        `<script src="${url('design/canvas/project/ds/kinscape')}/components/bundle.js"></script>`,
        '<x-import component-from-global-scope="K.B"></x-import>',
      ].join('')
    );
  });
});
