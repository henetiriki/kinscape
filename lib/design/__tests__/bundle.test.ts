import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  bundleEntry,
  bundleHeader,
  checkScript,
  checkStyle,
  checkTypes,
  CONTROLS,
  gatherTypes,
  JSX_SHIM,
} from '@ks/lib/design/bundle.mts';

const NAMES = CONTROLS.map(({ name }) => name);

describe('CONTROLS', () => {
  it('lists the 12 shared controls, each from a file that exists', () => {
    expect(NAMES).toEqual([
      'Button',
      'IconButton',
      'Chip',
      'ChipGroup',
      'Segmented',
      'Tabs',
      'TextField',
      'Checkbox',
      'CheckboxField',
      'DateField',
      'Alert',
      'Toast',
    ]);
    expect(CONTROLS.filter(({ path }) => !existsSync(path))).toEqual([]);
  });
});

describe('bundleHeader', () => {
  it('is the @ds-bundle comment with each name in order', () => {
    expect(bundleHeader(['A', 'B'])).toBe(
      '/* @ds-bundle: {"format":4,"namespace":"KinScape","components":[{"name":"A"},{"name":"B"}]} */'
    );
  });

  it('rejects a name that is not an ASCII identifier', () => {
    expect(() => bundleHeader(['Ok', '1bad'])).toThrow(
      'Control name 1bad is not an ASCII identifier'
    );
  });
});

describe('bundleEntry', () => {
  it('re-exports each control from its file under root', () => {
    expect(bundleEntry('/repo')).toBe(
      `${CONTROLS.map(({ name, path }) => `export { ${name} } from '/repo/${path}';`).join('\n')}\n`
    );
  });
});

describe('JSX_SHIM', () => {
  it('builds elements with createElement, spreading static children', () => {
    expect(JSX_SHIM).toContain("from 'react'");
    expect(JSX_SHIM).toContain('export const jsxs');
    expect(JSX_SHIM).toContain('export { Fragment }');
  });
});

describe('checkScript', () => {
  it('passes a small clean script', () => {
    expect(() => checkScript('window.KinScape = {};')).not.toThrow();
  });

  it.each([
    ['</script', 'x = "</script>"', 'bundle.js holds "</script"'],
    ['<!--', 'x = "<!--"', 'bundle.js holds "<!--"'],
    ['</SCRIPT', 'x = "</SCRIPT>"', 'bundle.js holds "</script"'],
    ['size', 'x'.repeat(6 * 1024 * 1024 + 1), 'bundle.js is over 6 MB'],
    ['bytes', 'é'.repeat(3 * 1024 * 1024 + 1), 'bundle.js is over 6 MB'],
  ])('fails on %s', (_name, code, message) => {
    expect(() => checkScript(code)).toThrow(message);
  });
});

describe('checkStyle', () => {
  it('passes a small clean stylesheet', () => {
    expect(() => checkStyle('a { color: red }')).not.toThrow();
  });

  it.each([
    [
      '</style',
      'a::after { content: "</style>" }',
      'bundle.css holds "</style"',
    ],
    ['size', 'x'.repeat(2 * 1024 * 1024 + 1), 'bundle.css is over 2 MB'],
  ])('fails on %s', (_name, css, message) => {
    expect(() => checkStyle(css)).toThrow(message);
  });
});

describe('checkTypes', () => {
  it('fails over 1.5 MB', () => {
    expect(() => checkTypes('x')).not.toThrow();
    expect(() => checkTypes('x'.repeat(1.5 * 1024 * 1024 + 1))).toThrow(
      'index.d.ts is over 1.5 MB'
    );
  });
});

describe('gatherTypes', () => {
  const controls = [
    { name: 'One', path: 'a/One.tsx' },
    { name: 'Two', path: 'a/Two.tsx' },
  ];
  const declarations = {
    '/r/a/One.d.ts': [
      "import type { ReactNode } from 'react';",
      "import type { Kind } from './types';",
      'export declare const One: (p: {',
      '    kind: Kind;',
      '    children: ReactNode;',
      '}) => null;',
      '',
    ].join('\n'),
    '/r/a/Two.d.ts': [
      "import type { ComponentProps, ReactNode } from 'react';",
      "import * as Other from 'other';",
      "import type { Kind } from '@ks/a/types';",
      "import type { One } from './One';",
      "import type { } from 'react';",
      'export declare const Two: (p: {',
      '    kind: Kind;',
      '    children: ReactNode;',
      '}) => null;',
      'export declare const Extra: number;',
      'export {};',
      '',
    ].join('\n'),
    '/r/a/types.d.ts':
      "export type Kind = 'x' | 'y';\nexport declare const MARKS: string[];\n",
    '/r/a/unused.d.ts': 'export type Unused = 1;\n',
  };

  it('writes the external imports once, then the shared types, then each control with its Props', () => {
    expect(gatherTypes('/r', controls, declarations)).toBe(
      [
        "import * as Other from 'other';",
        "import type { ComponentProps, ReactNode } from 'react';",
        '',
        "export type Kind = 'x' | 'y';",
        'declare const MARKS: string[];',
        '',
        'export declare const One: (p: {',
        '    kind: Kind;',
        '    children: ReactNode;',
        '}) => null;',
        'export type OneProps = Parameters<typeof One>[0];',
        '',
        'export declare const Two: (p: {',
        '    kind: Kind;',
        '    children: ReactNode;',
        '}) => null;',
        'declare const Extra: number;',
        'export type TwoProps = Parameters<typeof Two>[0];',
        '',
        'export {};',
        '',
      ].join('\n')
    );
  });

  it('fails naming a missing declaration', () => {
    expect(() =>
      gatherTypes('/r', controls, {
        '/r/a/One.d.ts': "import type { K } from './missing';\nexport {};\n",
        '/r/a/Two.d.ts': '',
      })
    ).toThrow('No declaration for ./missing imported by /r/a/One');
    expect(() => gatherTypes('/r', controls, {})).toThrow(
      'No declaration for a/One.tsx'
    );
  });
});
