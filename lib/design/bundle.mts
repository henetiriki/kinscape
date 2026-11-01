/** The pieces of the shared controls' bundle for the Design System (Spec #449). */

import { dirname, resolve } from 'node:path';

import type { Tree } from '../../design/types.ts';
import type { Control } from './types.ts';

import { fontVariable } from './css.mts';

const MB = 1024 * 1024;
const IMPORT = /^import [\s\S]*?from '([^']+)';\n?/gm;

/** The global the bundle sets, and the files a canvas loads, under `components/`. */
export const NAMESPACE = 'KinScape';
export const BUNDLE_CSS = 'bundle.css';
export const BUNDLE_JS = 'bundle.js';

/** The 12 shared controls (Spec #448), in display order. */
export const CONTROLS: Control[] = [
  { name: 'Button', path: 'app/components/actions/Button.tsx' },
  { name: 'IconButton', path: 'app/components/actions/IconButton.tsx' },
  { name: 'Chip', path: 'app/components/actions/Chip.tsx' },
  { name: 'ChipGroup', path: 'app/components/actions/ChipGroup.tsx' },
  { name: 'Segmented', path: 'app/components/actions/Segmented.tsx' },
  { name: 'Tabs', path: 'app/components/actions/Tabs.tsx' },
  { name: 'TextField', path: 'app/components/forms/TextField.tsx' },
  { name: 'Checkbox', path: 'app/components/forms/Checkbox.tsx' },
  { name: 'CheckboxField', path: 'app/components/forms/CheckboxField.tsx' },
  { name: 'DateField', path: 'features/map/components/DateField.tsx' },
  { name: 'Alert', path: 'app/components/feedback/Alert.tsx' },
  { name: 'Toast', path: 'app/components/feedback/Toast.tsx' },
];

/**
 * A `:root` block that sets each `--next-font-*` variable the tokens use to its first
 * family. The app gets them from `next/font`; a canvas page has no such loader.
 */
export const fontNames = (tokens: Tree): string => {
  const families = Object.values((tokens.font ?? {}) as Tree).map(stack =>
    String(stack).split(',')[0].trim().replaceAll("'", '')
  );

  return [
    ':root {',
    ...[...new Set(families)].map(
      family => `  ${fontVariable(family)}: '${family}';`
    ),
    '}',
    '',
  ].join('\n');
};

/** Line 1 of `bundle.js`: the type's `@ds-bundle` header listing `names`. */
export const bundleHeader = (names: string[]): string => {
  const bad = names.find(name => !/^[A-Za-z_$][\w$]*$/.test(name));

  if (bad !== undefined) {
    throw new Error(`Control name ${bad} is not an ASCII identifier`);
  }

  const components = JSON.stringify(names.map(name => ({ name })));

  // The type reads the keys in this order, which sorted keys would change.
  return `/* @ds-bundle: {"format":4,"namespace":"${NAMESPACE}","components":${components}} */`;
};

/** The bundle's entry module: each control, re-exported from its file under `root`. */
export const bundleEntry = (root: string): string =>
  `${CONTROLS.map(({ name, path }) => `export { ${name} } from '${root}/${path}';`).join('\n')}\n`;

/**
 * `react/jsx-runtime` for a page that has only `window.React`. `jsxs` spreads its children,
 * as React's own does, so a static list needs no keys.
 */
export const JSX_SHIM = `import { createElement, Fragment } from 'react';

const make = (type, props, key, spread) => {
  const { children, ...rest } = props;
  const config = key === undefined ? rest : { ...rest, key };

  if (children === undefined) return createElement(type, config);

  return spread
    ? createElement(type, config, ...children)
    : createElement(type, config, children);
};

export const jsx = (type, props, key) => make(type, props, key, false);
export const jsxs = (type, props, key) => make(type, props, key, true);
export { Fragment };
`;

const check = (file: string, text: string, banned: string[], max: number) => {
  // HTML closes tags in any case.
  const lower = text.toLowerCase();

  for (const string of banned) {
    if (lower.includes(string)) {
      throw new Error(`${file} holds "${string}"`);
    }
  }

  if (Buffer.byteLength(text) > max) {
    throw new Error(`${file} is over ${max / MB} MB`);
  }
};

/** Throws if `bundle.js` could end its `<script>` or is over 6 MB. */
export const checkScript = (code: string): void =>
  check(BUNDLE_JS, code, ['</script', '<!--'], 6 * MB);

/** Throws if `bundle.css` could end its `<style>` or is over 2 MB. */
export const checkStyle = (css: string): void =>
  check(BUNDLE_CSS, css, ['</style'], 2 * MB);

/** Throws if `index.d.ts` is over 1.5 MB. */
export const checkTypes = (text: string): void =>
  check('index.d.ts', text, [], 1.5 * MB);

const stem = (file: string): string =>
  file.replace(/\.d\.[cm]?ts$/, '').replace(/\.[cm]?[jt]sx?$/, '');

/**
 * One types file from the declarations TypeScript emitted (keyed by file). It holds the
 * declarations the controls reach, then each control with `<Name>Props` read from it: no
 * control exports its props type.
 */
export const gatherTypes = (
  root: string,
  controls: Control[],
  declarations: Record<string, string>
): string => {
  const byStem = new Map(
    Object.entries(declarations).map(([file, text]) => [stem(file), text])
  );
  const external = new Set<string>();
  const types = new Map<string, Set<string>>();
  const shared = new Map<string, string>();
  const bodies = new Map<string, string>();
  const queue: string[] = [];
  const controlStems = controls.map(({ path }) => stem(resolve(root, path)));
  // Only a control's own value is on `window.KinScape`, so no other value is exported.
  const bodyOf = (file: string, text: string, own?: string): string => {
    for (const match of text.matchAll(IMPORT)) {
      const specifier = match[1];

      if (specifier.startsWith('.') || specifier.startsWith('@ks/')) {
        const target = stem(
          specifier.startsWith('.')
            ? resolve(dirname(file), specifier)
            : resolve(root, specifier.slice(4))
        );

        if (!byStem.has(target)) {
          throw new Error(
            `No declaration for ${specifier} imported by ${file}`
          );
        }

        if (!controlStems.includes(target)) queue.push(target);
      } else {
        const named = /^import type \{([^}]*)\}/.exec(match[0]);

        if (named === null) {
          external.add(match[0].trim());
        } else {
          const names = named[1]
            .split(',')
            .map(name => name.trim())
            .filter(Boolean);

          types.set(
            specifier,
            new Set([...(types.get(specifier) ?? []), ...names])
          );
        }
      }
    }

    return text
      .replace(IMPORT, '')
      .replace(/^export \{\};\n?/m, '')
      .replace(
        /^export ((?:declare )?(?:const|function|class|enum|type|interface) ([\w$]+))/gm,
        (all, rest: string, name: string) =>
          name === own || /^(type|interface) /.test(rest) ? all : rest
      )
      .trim();
  };

  for (const [index, file] of controlStems.entries()) {
    const text = byStem.get(file);

    if (text === undefined) {
      throw new Error(`No declaration for ${controls[index].path}`);
    }

    bodies.set(file, bodyOf(file, text, controls[index].name));
  }

  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    if (!shared.has(next)) {
      shared.set(next, bodyOf(next, byStem.get(next) as string));
    }
  }

  return `${[
    [
      ...external,
      ...[...types].map(
        ([module, names]) =>
          `import type { ${[...names].toSorted().join(', ')} } from '${module}';`
      ),
    ]
      .toSorted()
      .join('\n'),
    ...[...shared.keys()].toSorted().map(file => shared.get(file) as string),
    ...controls.map(
      ({ name }, index) =>
        `${bodies.get(controlStems[index])}\nexport type ${name}Props = Parameters<typeof ${name}>[0];`
    ),
    // Turns off a declaration file's export of everything, so unexported values stay private.
    'export {};',
  ].join('\n\n')}\n`;
};
