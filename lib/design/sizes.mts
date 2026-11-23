/** The size check: each size in CSS and in inline `style` props, and the list of the off-token sizes on `main`. */

import ts from 'typescript';

import type { Tree } from '#ks/design/types.ts';
import type { Size, SizeEntry } from '#ks/lib/design/types.ts';

import {
  blank,
  declarations,
  keyOf,
  leaves,
  numbers,
  OWN,
  rulesFor,
  uncommented,
  withoutVars,
} from '#ks/lib/design/groups.mts';

type Found = { at: number; key: string; text: string };

/** The `//` form of an `own:` comment, which only a `style` prop accepts. */
const OWN_LINE = /\/\/\s*own:(.*)$/;

/** A number with its sign, digits and unit. The unit can be any word, so the regex reads `100dvh` and `60ch`. */
const LENGTH =
  /(?<![\w.#])(?<!\w-)(?<sign>-?)(?<digits>\d*\.\d+|\d+)(?<unit>[a-z]+|%)?(?![\w%.])/g;

/** A unit that is no size: a share, an angle or a resolution. */
const NO_SIZE = /^(%|fr|deg|grad|rad|turn|x|dppx|dpi|dpcm)$/;

const VIEWPORT = /^(vw|vh|dvh)$/;
const TIME = /^m?s$/;
const UNITLESS = /^(opacity|z-index|font-weight|line-height)$/;
const TIMED = /^(transition|animation)/;
const SHADOW = /^(box|text)-shadow$/;

const OFFSET = /translate(?:[XYZ]|3d)?\(([^)]*)\)/g;

/** A property with a size and no group: opacity, border width, transform offsets and custom properties. */
const GROUPLESS =
  /^(opacity|text-shadow|transform|translate|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|--.*)$/;

const isRead = (property: string) =>
  GROUPLESS.test(property) ||
  rulesFor(property).some(rule => rule.kind !== 'colour');

/** The text that holds only the arguments of `translate*()`. */
const translations = (text: string): string => {
  const out = [...blank(text)];

  for (const match of text.matchAll(OFFSET)) {
    const start = match.index + match[0].indexOf('(') + 1;

    [...match[1]].forEach((char, index) => {
      out[start + index] = char;
    });
  }

  return out.join('');
};

/** Each size of a value that is not a pass form: `0`, a share, a keyword, `100vw`, `* 1px`. */
const lengthsIn = (property: string, value: string): Found[] => {
  const timed = TIMED.test(property);
  const text = withoutVars(value);
  const scanned = property === 'transform' ? translations(text) : text;

  return [...scanned.matchAll(LENGTH)]
    .filter(({ groups }) => {
      const { digits, unit } = groups!;

      return (
        Number(digits) !== 0 &&
        (unit !== undefined || UNITLESS.test(property)) &&
        !NO_SIZE.test(unit ?? '') &&
        TIME.test(unit ?? '') === timed &&
        !(VIEWPORT.test(unit ?? '') && Number(digits) === 100)
      );
    })
    .filter(
      match =>
        !(
          Number(match.groups!.digits) === 1 &&
          /\*\s*$/.test(scanned.slice(0, match.index))
        )
    )
    .map(match => ({
      at: match.index,
      key: keyOf(match.groups!.digits, match.groups!.unit),
      text: match[0],
    }));
};

/** The keys of the tokens of a property's groups. */
const tokenKeys = (property: string, tokens: Tree): Set<string> =>
  new Set(
    rulesFor(property)
      .filter(rule => rule.kind !== 'colour' && rule.kind !== 'shadow')
      .flatMap(rule =>
        leaves(rule.pick(tokens)).flatMap(token =>
          numbers(token, rule.kind === 'duration').map(number => number.key)
        )
      )
  );

const flat = (text: string) =>
  text.trim().replaceAll(/\s+/g, ' ').toLowerCase();

const isShadowToken = (property: string, value: string, tokens: Tree) =>
  SHADOW.test(property) &&
  rulesFor(property).some(rule =>
    leaves(rule.pick(tokens)).some(
      token => flat(token) === flat(withoutVars(value))
    )
  );

type Part = { at: number; property: string; token: boolean; value: string };

/** The sizes of one value with their offset in it. `token`: the size equals a token of its group. */
const partsOf = (property: string, value: string, tokens: Tree): Part[] => {
  if (!isRead(property)) return [];

  const keys = tokenKeys(property, tokens);
  const whole = isShadowToken(property, value, tokens);

  return lengthsIn(property, value).map(found => ({
    at: found.at,
    property,
    token: whole || keys.has(found.key),
    value: found.text,
  }));
};

const ownOf = (row: string, line = false) =>
  ((OWN.exec(row) ?? (line ? OWN_LINE.exec(row) : null))?.[1] ?? '').trim() !==
  '';

const lineAt = (text: string, offset: number) =>
  text.slice(0, offset).split('\n').length;

const cssSizes = (file: string, text: string, tokens: Tree): Size[] => {
  const rows = text.split('\n');
  const clean = uncommented(text);
  const make = (part: Part, line: number): Size => ({
    file,
    line,
    own: ownOf(rows[line - 1]),
    property: part.property,
    token: part.token,
    value: part.value,
  });
  const values = declarations(text);
  const media = [...clean.matchAll(/@media(?<value>[^{]*)\{/g)].map(match => ({
    base: match.index + '@media'.length,
    property: '@media',
    value: match.groups!.value,
  }));

  return [...values, ...media].flatMap(({ base, property, value }) =>
    property === '@media'
      ? lengthsIn('@media', value).map(found =>
          make(
            {
              at: found.at,
              property,
              token: tokenKeys(property, tokens).has(found.key),
              value: found.text,
            },
            lineAt(clean, base + found.at)
          )
        )
      : partsOf(property, value, tokens).map(part =>
          make(part, lineAt(clean, base + part.at))
        )
  );
};

const kebab = (name: string) =>
  name.replaceAll(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** The text of a literal that a style value is, or undefined for an expression. */
const literalOf = (node: ts.Expression): string | undefined => {
  if (ts.isNumericLiteral(node)) return node.text;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
    ? `-${node.operand.text}`
    : undefined;
};

const unwrap = (node: ts.Expression): ts.Expression =>
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isParenthesizedExpression(node)
    ? unwrap(node.expression)
    : node;

/** Each object literal of a `style` attribute. */
const styleObjects = (root: ts.Node): ts.ObjectLiteralExpression[] => {
  const found: ts.ObjectLiteralExpression[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'style' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    ) {
      const value = unwrap(node.initializer.expression);

      if (ts.isObjectLiteralExpression(value)) found.push(value);
    }

    ts.forEachChild(node, visit);
  };

  visit(root);

  return found;
};

const tsxSizes = (file: string, text: string, tokens: Tree): Size[] => {
  if (!text.includes('style=')) return [];

  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const rows = text.split('\n');

  return styleObjects(source)
    .flatMap(object => object.properties)
    .flatMap(member => {
      if (
        !ts.isPropertyAssignment(member) ||
        !(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))
      ) {
        return [];
      }

      const literal = literalOf(unwrap(member.initializer));
      const name = member.name.text;
      const property = ts.isIdentifier(member.name) ? kebab(name) : name;

      if (literal === undefined) return [];

      const init = unwrap(member.initializer);
      const number =
        !ts.isStringLiteral(init) && !ts.isNoSubstitutionTemplateLiteral(init);
      const value =
        number && !UNITLESS.test(property) ? `${literal}px` : literal;
      const first =
        source.getLineAndCharacterOfPosition(member.initializer.getStart())
          .line + 1;

      return partsOf(property, value, tokens).map(part => ({
        file,
        line: first + value.slice(0, part.at).split('\n').length - 1,
        own: ownOf(rows[first - 1], true),
        property: part.property,
        token: part.token,
        value: part.value,
      }));
    });
};

/** A tracked file that the size check reads. */
export const isSizeFile = (path: string): boolean =>
  /\.module\.css$/.test(path) ||
  path === 'app/globals.css' ||
  (/\.tsx$/.test(path) &&
    !/(^|\/)(__tests__|e2e)\//.test(path) &&
    !/\.(test|spec)\.tsx$/.test(path));

/** Each size of a file that is not a pass form, with its status. `.css` is CSS, `.tsx` is a `style` prop. */
export const sizesIn = (file: string, text: string, tokens: Tree): Size[] =>
  file.endsWith('.css')
    ? cssSizes(file, text, tokens)
    : tsxSizes(file, text, tokens);

const needsEntry = (size: Size) => !size.token && !size.own;

const keyFor = (size: { file: string; property: string; value: string }) =>
  JSON.stringify([size.file, size.property, size.value]);

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const groups = (sizes: Size[]) => {
  const found = new Map<string, Size[]>();

  for (const size of sizes.filter(needsEntry)) {
    found.set(keyFor(size), [...(found.get(keyFor(size)) ?? []), size]);
  }

  return found;
};

/** The list of the sizes that need an entry: one for each file, property and value, with a count. */
export const listOf = (sizes: Size[]): SizeEntry[] =>
  [...groups(sizes).values()]
    .map(([first, ...rest]) => ({
      count: rest.length + 1,
      file: first.file,
      property: first.property,
      value: first.value,
    }))
    .toSorted(
      (a, b) =>
        compare(a.file, b.file) ||
        compare(a.property, b.property) ||
        compare(a.value, b.value)
    );

/** What is wrong when `list` and the code of `sizes` differ. */
export const listProblems = (sizes: Size[], list: SizeEntry[]): string[] => {
  const found = groups(sizes);
  const counts = new Map(list.map(entry => [keyFor(entry), entry.count]));
  const extra = [...found].flatMap(([key, copies]) =>
    copies
      .slice(counts.get(key) ?? 0)
      .map(
        size =>
          `${size.file}:${size.line}: ${size.property}: ${size.value} is off the tokens: use a token, add /* own: <reason> */ or run npm run sizes`
      )
  );
  const stale = list.flatMap(entry => {
    const actual = found.get(keyFor(entry))?.length ?? 0;
    const name = `${entry.file} ${entry.property} ${entry.value}`;

    if (actual === 0) {
      return [
        `${name} is on the list, but the code has no size like it: run npm run sizes`,
      ];
    }

    return actual < entry.count
      ? [
          `${name} is on the list ${entry.count} times, but the code has ${actual}: run npm run sizes`,
        ]
      : [];
  });

  return [...extra, ...stale];
};
