import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import ts from 'typescript';

import type { Specifier } from '#ks/scripts/types.ts';

import { MODULE_CALL, SOURCE_EXTENSION } from '#ks/scripts/layers.mts';

// How the fitness tests read the repo: each source file's text, and the modules it names,
// taken from the syntax tree rather than the text, so a comment or a string is never one.

/** A test file or helper: outside every rule. */
export const TEST_FILE = /(?:^|\/)__tests__\/|\.(?:test|spec)\./;

/** The module a node names, if it is an import, re-export, `import()`, `import('…').T`, `import x = require()`, `require()` or `vi.mock()`. */
export const moduleOf = (node: ts.Node): ts.Node | undefined => {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    return node.moduleSpecifier;
  }

  if (ts.isCallExpression(node)) {
    return node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      MODULE_CALL.test(node.expression.getText())
      ? node.arguments[0]
      : undefined;
  }

  if (ts.isImportTypeNode(node)) {
    return ts.isLiteralTypeNode(node.argument)
      ? node.argument.literal
      : undefined;
  }

  return ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference)
    ? node.moduleReference.expression
    : undefined;
};

/** Whether a node brings in types only: `import type`, `export type … from` or `import('…').T`. */
const isTypeOnly = (node: ts.Node): boolean =>
  (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly === true) ||
  (ts.isExportDeclaration(node) && node.isTypeOnly) ||
  ts.isImportTypeNode(node);

/** Parses a source as TypeScript, with JSX for `.tsx`. */
export const parse = (path: string, source: string): ts.SourceFile =>
  ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);

/** The modules a source names, in order, each with whether only types come from it. */
export const specifiersOf = (path: string, source: string): Specifier[] => {
  const found: Specifier[] = [];
  const visit = (node: ts.Node): void => {
    const target = moduleOf(node);

    if (target !== undefined && ts.isStringLiteralLike(target)) {
      found.push({ specifier: target.text, typeOnly: isTypeOnly(node) });
    }

    ts.forEachChild(node, visit);
  };

  visit(parse(path, source));

  return found;
};

/** Each file under the roots, as repo path → text; a missing root is skipped. */
export const readSources = (
  roots: string[],
  keep: RegExp = SOURCE_EXTENSION
): Record<string, string> =>
  Object.fromEntries(
    roots
      .filter(dir => existsSync(dir))
      .flatMap(dir =>
        readdirSync(dir, { recursive: true, withFileTypes: true })
          .filter(entry => entry.isFile())
          .map(entry =>
            `${entry.parentPath}/${entry.name}`.split(sep).join('/')
          )
          .filter(path => keep.test(path))
          .map(path => [path, readFileSync(path, 'utf8')])
      )
  );
