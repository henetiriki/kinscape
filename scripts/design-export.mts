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
import { format, resolveConfig } from 'prettier';

import type { CanvasExport, DesignExportDeps } from './types.ts';

const ARTBOARD_DIR = 'design/canvas/project';
const EXPORT_FILE = 'design/canvas/export.json';
const SOURCE_DIR = 'design/source';
const ICON_PATH = '../../app/icon0.svg';

const FORBIDDEN = [
  'var(',
  'calc(',
  '<script',
  '{{',
  '_blob',
  'http://',
  'https://',
  '.dc.html',
  '@import',
];

/**
 * Functions the colour check can read. Any other in CSS or an attribute fails, so a colour
 * syntax missing from this file (`hsl()`, `color-mix()`, `url()` to a file) can't pass.
 */
const FUNCTIONS = new Set(
  'linear-gradient minmax radial-gradient repeat repeating-linear-gradient rgb rgba rotate scale translate translatex translatey'.split(
    ' '
  )
);

/** CSS colour keywords, system colours and Chromium's `-webkit-` colours. */
const COLOUR_KEYWORDS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext activeborder activecaption appworkspace buttonhighlight buttonshadow captiontext inactiveborder inactivecaption inactivecaptiontext infobackground infotext menutext scrollbar threeddarkshadow threedface threedhighlight threedlightshadow threedshadow window windowframe windowtext background menu -webkit-activelink -webkit-focus-ring-color -webkit-link -webkit-text`.split(
    ' '
  )
);

/**
 * Everything the browser reads as CSS or attributes, not page text: the values in `style`
 * attributes and `<style>` blocks, and every other attribute. Chromium writes every attribute
 * double-quoted.
 */
const MARKUP = /\s([\w:-]+)="([^"]*)"|<style[^>]*>([\s\S]*?)<\/style>/gi;
/** A `<style>` block's declarations: the text in its innermost braces, not its selectors. */
const DECLARATIONS = /\{([^{}]*)\}/g;
const CSS_VALUE = /[a-z-]+\s*:([^;{}]*)/gi;
/** Attributes that hold text or a reference, never a colour. Any other is read, so one missing here can only fail the export. */
const TEXT_ATTRIBUTE =
  /^(?:aria-[\w-]+|data-[\w-]+|alt|class|content|for|href|id|label|lang|name|placeholder|role|title|type|value)$/;

const cssValues = (css: string): string[] =>
  [...css.matchAll(CSS_VALUE)].map(([, value]) => String(value));

const markupValues = (html: string): string[] =>
  [...html.matchAll(MARKUP)].flatMap(([, name, value, block]) => {
    if (block !== undefined) {
      return [...block.matchAll(DECLARATIONS)].flatMap(([, declarations]) =>
        cssValues(String(declarations))
      );
    }

    if (name === 'style') {
      return cssValues(String(value));
    }

    return TEXT_ATTRIBUTE.test(String(name)) ? [] : [String(value)];
  });

/**
 * Attributes the browser reads as a colour, the values the check can read in each, and the
 * words that add no colour. SVG attributes take CSS colours. The legacy HTML ones (and SVG
 * `color`, to be safe) make a colour of any other text, such as `none`, `rgb()` or 8-digit hex.
 */
const COLOUR_ATTRIBUTES: [RegExp, RegExp, Set<string>][] = [
  [
    /\s(?:fill|stroke|stop-color|flood-color|lighting-color)="([^"]*)"/gi,
    /^\s*(?:url\(#[\w-]+\)\s*)?(?:#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})|rgba?\([^)]*\)|([\w-]+))?\s*$/i,
    new Set(['currentcolor', 'inherit', 'none', 'transparent']),
  ],
  [
    /\s(?:alink|bgcolor|bordercolor|color|link|text|vlink)="([^"]*)"/gi,
    /^\s*(?:#(?:[0-9a-f]{6}|[0-9a-f]{3})|([\w-]+))\s*$/i,
    new Set(['transparent']),
  ],
];

const unreadableColours = (html: string): string[] =>
  COLOUR_ATTRIBUTES.flatMap(([attribute, readable, plain]) =>
    [...html.matchAll(attribute)]
      .filter(([, value]) => {
        const match = readable.exec(String(value));
        const word = match?.[1]?.toLowerCase();

        return (
          !match ||
          (word !== undefined && !plain.has(word) && !COLOUR_KEYWORDS.has(word))
        );
      })
      .map(([text]) => `${text.trim()} cannot be read as a colour`)
  );

const RGB_FUNCTION = /rgba?\([^)]*\)/gi;
const RGB_INTEGERS = /^rgba?\(\s*\d+[ ,]+\d+[ ,]+\d+[^)]*\)$/i;

const COLOUR =
  /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b|rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)[^)]*\)/gi;

export const readCanvasExport = (root: string): CanvasExport =>
  JSON.parse(readFileSync(join(root, EXPORT_FILE), 'utf8')) as CanvasExport;

/** Where each artboard link in a snapshot goes: the artboard's first snapshot without props or state. */
export const linkMap = (canvas: CanvasExport): Record<string, string> => {
  const links: Record<string, string> = {};

  for (const { file, name, props, state } of canvas.snapshots) {
    if (!props && !state) {
      links[file] ??= `${name}.html`;
    }
  }

  for (const [file, name] of Object.entries(canvas.links)) {
    links[file] = `${name}.html`;
  }

  return links;
};

/** The artboard as Chromium loads it: local fonts and icon, and no canvas `support.js`. */
export const prepare = (
  html: string,
  icon: string,
  urls: { fonts: string; icon: string }
): string =>
  html
    .replace(/<link[^>]+fonts\.(?:googleapis|gstatic)[^>]*>/g, '')
    .replace(
      '<script src="./support.js"></script>',
      () => `<link rel="stylesheet" href="${urls.fonts}">`
    )
    .replaceAll(icon, () => urls.icon);

/** The page's HTML with the icon and artboard links pointing at repo files. */
export const finish = (
  html: string,
  iconUrl: string,
  links: Record<string, string>
): string =>
  html
    .replaceAll(iconUrl, () => ICON_PATH)
    .replace(/href="([\w-]+\.dc\.html)"/g, (match, file: string) =>
      file in links ? `href="${links[file]}"` : match
    );

const colours = (text: string) =>
  [...text.matchAll(COLOUR)].map(([match, hex, red, green, blue]) => {
    const digits = hex?.length === 4 ? hex.slice(0, 3) : hex?.slice(0, 6);
    const full = digits?.length === 3 ? digits.replace(/./g, '$&$&') : digits;
    const rgb = full
      ? [0, 2, 4].map(at => parseInt(full.slice(at, at + 2), 16))
      : [red, green, blue].map(Number);

    return { rgb: rgb.join(','), text: match };
  });

/** Every colour in `design/tokens.json`, as `r,g,b`. */
export const tokenColours = (tokensJson: string): Set<string> =>
  new Set(colours(tokensJson).map(({ rgb }) => rgb));

/** What keeps a snapshot from being self-contained and on-token; empty when it is. */
export const snapshotProblems = (
  html: string,
  tokens: Set<string>
): string[] => [
  ...FORBIDDEN.filter(text => html.includes(text)).map(
    text => `contains ${text}`
  ),
  ...new Set([
    ...[...html.matchAll(RGB_FUNCTION)]
      .map(([text]) => text)
      .filter(text => !RGB_INTEGERS.test(text))
      .map(text => `${text} cannot be read as a colour`),
    ...unreadableColours(html),
    ...colours(html)
      .filter(({ rgb }) => !tokens.has(rgb))
      .map(({ text }) => `${text} is not in design/tokens.json`),
    ...markupValues(html).flatMap(value => [
      ...[...value.matchAll(/url\(#|([a-z-][\w-]*)\(/gi)]
        .map(([, name]) => name)
        .filter(
          name =>
            name !== undefined &&
            !FUNCTIONS.has(name.toLowerCase()) &&
            !FORBIDDEN.includes(`${name}(`)
        )
        .map(name => `uses ${name}(), which the colour check cannot read`),
      ...[...value.matchAll(/(?<![\w#.%-])-?[a-z][\w-]*(?![\w(-])/gi)]
        .map(([word]) => word)
        .filter(word => COLOUR_KEYWORDS.has(word.toLowerCase()))
        .map(word => `${word} is not in design/tokens.json`),
      ...(value.includes('\\')
        ? [
            `${value.trim()} uses a CSS escape, which the colour check cannot read`,
          ]
        : []),
    ]),
  ]),
];

type Component = new (props: Scope) => {
  renderVals: () => Scope;
  state: Scope;
};

type Scope = Record<string, unknown>;

/**
 * Runs in the page: fills the artboard's template (`{{…}}`, `sc-for`, `sc-if`, `data-props`
 * defaults) from its Component's `renderVals()`. Playwright sends only this function's source,
 * so it uses nothing from the module.
 */
export const fillTemplate = ({
  props,
  state,
}: {
  props: Scope;
  state: Scope;
}): void => {
  const template = document.querySelector('x-dc');
  const source = document.querySelector('script[data-dc-script]');

  if (!template || !source) {
    throw new Error('Not a canvas artboard: no <x-dc> or data-dc-script');
  }

  // The artboard's own script, run as a script element in a block so it leaves no globals;
  // it hands its Component back on the element.
  const run = document.createElement('script') as {
    component?: Component;
  } & HTMLScriptElement;

  run.textContent = `{
class DCLogic {
  constructor(props) { this.props = props || {}; this.state = this.state || {}; }
  setState(next) { Object.assign(this.state, next); }
}
${source.textContent}
document.currentScript.component = typeof Component === 'undefined' ? undefined : Component;
}`;
  document.body.append(run);

  const Artboard = run.component;

  if (!Artboard) {
    throw new Error('The artboard script defines no Component');
  }

  const definitions = JSON.parse(
    source.getAttribute('data-props') ?? '{}'
  ) as Record<string, object>;
  const merged: Scope = {};

  for (const [key, definition] of Object.entries(definitions)) {
    if (!key.startsWith('$') && 'default' in definition) {
      merged[key] = definition.default;
    }
  }

  const component = new Artboard({ ...merged, ...props });

  Object.assign(component.state, state);

  const read = (scope: Scope, path: string): unknown => {
    const trimmed = path.trim();

    if (trimmed === 'true' || trimmed === 'false') {
      return trimmed === 'true';
    }

    return trimmed
      .split('.')
      .reduce<unknown>(
        (value, key) => (value == null ? undefined : (value as Scope)[key]),
        scope
      );
  };
  const whole = (text: string) =>
    /^\s*\{\{([^}]+)\}\}\s*$/.exec(text)?.[1] ?? null;
  const fill = (text: string, scope: Scope) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
      const value = read(scope, path);

      return value == null ? '' : String(value);
    });
  const bound = (element: Element, name: string, scope: Scope) => {
    const path = whole(element.getAttribute(name) ?? '');

    if (path === null) {
      throw new Error(
        `<${element.tagName.toLowerCase()} ${name}> needs one {{…}} binding`
      );
    }

    return read(scope, path);
  };
  const walk = (node: Node, scope: Scope): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue?.includes('{{')) {
          child.nodeValue = fill(child.nodeValue, scope);
        }

        continue;
      }

      if (!(child instanceof Element)) {
        continue;
      }

      const tag = child.tagName.toLowerCase();

      if (tag === 'sc-for') {
        const list = (bound(child, 'list', scope) || []) as unknown[];
        const as = child.getAttribute('as') || 'item';
        const fragment = document.createDocumentFragment();

        list.forEach((item, index) => {
          const wrap = document.createElement('div');

          wrap.innerHTML = child.innerHTML;
          walk(wrap, { ...scope, $index: index, [as]: item });
          fragment.append(...wrap.childNodes);
        });
        child.replaceWith(fragment);
        continue;
      }

      if (tag === 'sc-if') {
        if (bound(child, 'value', scope)) {
          walk(child, scope);
          child.replaceWith(...child.childNodes);
        } else {
          child.remove();
        }

        continue;
      }

      for (const { name, value } of Array.from(child.attributes)) {
        if (!value.includes('{{')) {
          continue;
        }

        const path = whole(value);

        if (/^on[a-z]+$/.test(name)) {
          child.removeAttribute(name);
        } else if (
          path !== null &&
          (name === 'checked' || name === 'disabled')
        ) {
          if (read(scope, path)) {
            child.setAttribute(name, '');
          } else {
            child.removeAttribute(name);
          }
        } else {
          child.setAttribute(name, fill(value, scope));
        }
      }

      walk(child, scope);
    }
  };

  const helmet = template.querySelector('helmet');

  if (helmet) {
    document.head.append(...helmet.childNodes);
    helmet.remove();
  }

  walk(template, component.renderVals());
};

/**
 * Runs in the page: the filled artboard as a snapshot, with scripts, links and `<x-dc>` gone,
 * `calc()` resolved and `fonts.css` loaded. Uses nothing from the module, as `fillTemplate`.
 */
export const pageHtml = (): string => {
  const title = document.querySelector('title');

  if (!title) {
    throw new Error('The artboard has no <title>');
  }

  for (const script of document.querySelectorAll('script')) {
    script.remove();
  }

  for (const wrapper of document.querySelectorAll('x-dc')) {
    wrapper.replaceWith(...wrapper.childNodes);
  }

  for (const element of document.querySelectorAll<HTMLElement | SVGElement>(
    '[style]'
  )) {
    const { style } = element;

    for (let index = style.length - 1; index >= 0; index -= 1) {
      const property = style[index];

      if (style.getPropertyValue(property).includes('calc(')) {
        style.setProperty(
          property,
          getComputedStyle(element).getPropertyValue(property)
        );
      }
    }
  }

  for (const link of document.querySelectorAll('link')) {
    link.remove();
  }

  const fonts = document.createElement('link');

  fonts.rel = 'stylesheet';
  fonts.href = 'fonts.css';
  title.after(fonts);

  return `<!doctype html>\n${document.documentElement.outerHTML}\n`;
};

const fileUrl = (root: string, path: string) =>
  pathToFileURL(resolve(root, path)).href;

/**
 * Exports the named snapshots (all when none are named) from the canvas copy into
 * `design/source/`; returns the ones whose bytes changed. Writes nothing if any fails a check.
 */
export const exportSnapshots = async (
  root: string,
  names: string[],
  deps: DesignExportDeps
): Promise<string[]> => {
  const canvas = readCanvasExport(root);
  const unknown = names.filter(
    name => !canvas.snapshots.some(snapshot => snapshot.name === name)
  );

  if (unknown.length > 0) {
    throw new Error(`No snapshot named: ${unknown.join(', ')}`);
  }

  const links = linkMap(canvas);
  const tokens = tokenColours(
    readFileSync(join(root, 'design/tokens.json'), 'utf8')
  );
  const urls = {
    fonts: fileUrl(root, `${SOURCE_DIR}/fonts.css`),
    icon: fileUrl(root, 'app/icon0.svg'),
  };
  const outputs: [string, string][] = [];
  const problems: string[] = [];

  for (const snapshot of canvas.snapshots) {
    if (names.length > 0 && !names.includes(snapshot.name)) {
      continue;
    }

    const artboard = readFileSync(
      join(root, ARTBOARD_DIR, snapshot.file),
      'utf8'
    );
    const target = join(root, SOURCE_DIR, `${snapshot.name}.html`);
    const rendered = await deps.render(
      prepare(artboard, canvas.icon, urls),
      snapshot
    );
    const html = await format(finish(rendered, urls.icon, links), {
      ...(await resolveConfig(target, { editorconfig: true })),
      filepath: target,
    });

    problems.push(
      ...snapshotProblems(html, tokens).map(
        problem => `${snapshot.file} → ${snapshot.name}.html: ${problem}`
      )
    );
    outputs.push([snapshot.name, html]);
  }

  if (problems.length > 0) {
    throw new Error(`No snapshot written:\n${problems.join('\n')}`);
  }

  const changed: string[] = [];

  mkdirSync(join(root, SOURCE_DIR), { recursive: true });

  for (const [name, html] of outputs) {
    const target = join(root, SOURCE_DIR, `${name}.html`);

    if (!existsSync(target) || readFileSync(target, 'utf8') !== html) {
      writeFileSync(target, html);
      changed.push(name);
    }
  }

  return changed;
};

/* v8 ignore start -- launches Chromium; only runs when invoked directly */
if (import.meta.main) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const dir = mkdtempSync(join(tmpdir(), 'design-export-'));

  try {
    const changed = await exportSnapshots('.', process.argv.slice(2), {
      render: async (html, { name, props = {}, state = {}, viewport }) => {
        const file = join(dir, `${name}.html`);
        const page = await browser.newPage({ viewport });
        const errors: string[] = [];

        writeFileSync(file, html);
        page.on('pageerror', error => errors.push(error.message));
        await page.route(
          target => target.protocol !== 'file:',
          route => {
            errors.push(`requested ${route.request().url()}`);

            return route.abort();
          }
        );
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(fillTemplate, { props, state });
        await page.evaluate(() => document.fonts.ready);

        const snapshot = await page.evaluate(pageHtml);

        await page.close();

        if (errors.length > 0) {
          throw new Error(`${name}: ${errors.join('; ')}`);
        }

        return snapshot;
      },
    });

    console.log(
      changed.length > 0
        ? `Rewrote: ${changed.join(', ')}`
        : 'No snapshot changed.'
    );
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    rmSync(dir, { force: true, recursive: true });
  }
}
/* v8 ignore stop */
