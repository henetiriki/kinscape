import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { build } from 'vite';

import type { Tree } from '../design/types.ts';
import type { Control, Docs } from '../lib/design/types.ts';

import {
  BUNDLE_CSS,
  BUNDLE_JS,
  bundleEntry,
  bundleHeader,
  checkScript,
  checkStyle,
  checkTypes,
  CONTROLS,
  gatherTypes,
  JSX_SHIM,
  NAMESPACE,
} from '../lib/design/bundle.mts';
import {
  checkPreview,
  checkReadme,
  controlReadme,
  designBullets,
  firstSentence,
  previewHtml,
} from '../lib/design/cards.mts';
import { CARDS } from '../lib/design/states.mts';
import {
  fontFiles,
  readme,
  systemCss,
  systemFonts,
  systemIndex,
  systemTokens,
  unicodeRange,
} from '../lib/design/system.mts';

const OUTPUT = '.design-system';
// Vite resolves the entry against the root, so the entry's id is a path that never exists.
const ENTRY = 'ks-controls.virtual.js';
const SHIM = '\0ks-jsx-runtime';

// Vite doesn't re-export Rolldown's types, and `rolldown` isn't a declared dependency.
type Built = Exclude<
  Awaited<ReturnType<typeof build>>,
  { close: unknown } | unknown[]
>;

type Controls = {
  css: string;
  docs: Record<string, Docs>;
  js: string;
  types: string;
};
type Output = Built['output'][number];

/** The program of the controls, as the app's `tsconfig.json` sets it up. */
const compile = (root: string): ts.Program => {
  const config = ts.readConfigFile(
    join(root, 'tsconfig.json'),
    ts.sys.readFile
  );
  const { options } = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    root
  );

  return ts.createProgram(
    CONTROLS.map(({ path }) => join(root, path)),
    {
      ...options,
      declaration: true,
      emitDeclarationOnly: true,
      incremental: false,
      noEmit: false,
    }
  );
};

/** The `.d.ts` text TypeScript emits for the controls and what they import, keyed by file. */
const declarations = (program: ts.Program): Record<string, string> => {
  const emitted: Record<string, string> = {};

  program.emit(
    undefined,
    (file, text) => {
      emitted[file] = text;
    },
    undefined,
    true
  );

  return emitted;
};

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

/**
 * A control's JSDoc summary and the props its source declares. Props it takes from its HTML
 * element (declared under `node_modules`) are left out, and `rest` says there were some.
 */
const describeControl = (
  program: ts.Program,
  root: string,
  { name, path }: Control
): Docs => {
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(join(root, path))!;
  const symbol = checker
    .getExportsOfModule(checker.getSymbolAtLocation(file)!)
    .find(each => each.name === name)!;
  const [signature] = checker
    .getTypeOfSymbolAtLocation(symbol, file)
    .getCallSignatures();
  const [parameter] = signature.getParameters();
  const all = checker.getPropertiesOfType(
    checker.getTypeOfSymbolAtLocation(parameter, file)
  );
  const own = all.filter(prop =>
    prop.declarations!.some(
      declaration =>
        !declaration.getSourceFile().fileName.includes('/node_modules/')
    )
  );
  const typeText = (prop: ts.Symbol): string => {
    const type = checker.getTypeOfSymbolAtLocation(prop, file);
    const members = type.isUnion()
      ? type.types.filter(member => !(member.flags & ts.TypeFlags.Undefined))
      : [type];

    return members.every(member => member.isLiteral())
      ? members.map(member => checker.typeToString(member)).join(' | ')
      : checker
          .typeToString(type, file, ts.TypeFormatFlags.NoTruncation)
          .replace(/ \| undefined$/, '');
  };

  return {
    props: own
      .map(prop => ({
        doc: oneLine(
          ts.displayPartsToString(prop.getDocumentationComment(checker))
        ),
        name: prop.name,
        optional: Boolean(prop.flags & ts.SymbolFlags.Optional),
        type: typeText(prop),
      }))
      .toSorted((a, b) => a.name.localeCompare(b.name)),
    rest: own.length < all.length,
    summary: firstSentence(
      ts.displayPartsToString(symbol.getDocumentationComment(checker))
    ),
  };
};

/**
 * Builds the shared controls from their own source: one IIFE that reads the page's `React`
 * and sets `KinScape`, its CSS, and one types file. Nothing is written to disk.
 */
const buildControls = async (root: string): Promise<Controls> => {
  const base = resolve(root);
  const entry = join(base, ENTRY);
  const built = await build({
    build: {
      cssCodeSplit: false,
      lib: { entry: ENTRY, formats: ['iife'], name: NAMESPACE },
      minify: true,
      rolldownOptions: {
        external: ['react', 'react-dom'],
        output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
      },
      write: false,
    },
    configFile: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
    mode: 'production',
    oxc: { jsx: { development: false, runtime: 'automatic' } },
    plugins: [
      {
        // Before Vite's own resolver, which would bundle the app's React 19 runtime.
        enforce: 'pre',
        load: id =>
          id === entry ? bundleEntry(base) : id === SHIM ? JSX_SHIM : null,
        name: 'ks-controls',
        resolveId: id =>
          id === entry ? entry : id === 'react/jsx-runtime' ? SHIM : null,
      },
    ],
    publicDir: false,
    resolve: { alias: { '@ks': base } },
    root: base,
  });
  // A library build returns one output per format.
  const [{ output }] = [built].flat() as Built[];
  const code = output.find(file => file.type === 'chunk') as Extract<
    Output,
    { type: 'chunk' }
  >;
  const css = output.find(file => file.fileName.endsWith('.css')) as Extract<
    Output,
    { type: 'asset' }
  >;

  const program = compile(base);

  return {
    css: String(css.source),
    docs: Object.fromEntries(
      CONTROLS.map(control => [
        control.name,
        describeControl(program, base, control),
      ])
    ),
    js: code.code,
    types: gatherTypes(base, CONTROLS, declarations(program)),
  };
};

const git = (root: string, args: string[]): string =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/** The `unicode-range` the package's own stylesheets give the font file `file`. */
const rangeOf = (packageDir: string, file: string): string | undefined =>
  readdirSync(packageDir)
    .filter(name => name.endsWith('.css'))
    .toSorted()
    .map(name =>
      unicodeRange(readFileSync(join(packageDir, name), 'utf8'), file)
    )
    .find(range => range !== undefined);

/**
 * Empties `out` and writes the design system's `project/` there: the index, tokens, fonts,
 * icons, README, cover and the shared controls' bundle. Returns the files written, relative
 * to `out`. Two runs on one commit write the same bytes: the timestamps are HEAD's commit time.
 */
export const run = async (root: string, out: string): Promise<string[]> => {
  const raw = JSON.parse(
    readFileSync(join(root, 'design/tokens.json'), 'utf8')
  ) as Tree;
  const files = fontFiles(readFileSync(join(root, 'app/layout.tsx'), 'utf8'));
  const fonts = systemFonts(files, raw);
  const system = systemTokens(raw, fonts);
  const sha = git(root, ['rev-parse', 'HEAD']).slice(0, 7);
  const at = new Date(
    Number(git(root, ['log', '-1', '--format=%ct'])) * 1000
  ).toISOString();
  const design = readFileSync(join(root, 'design/DESIGN.md'), 'utf8');
  const written: string[] = [];
  const put = (path: string, write: (target: string) => void) => {
    const target = join(out, 'project', path);

    mkdirSync(dirname(target), { recursive: true });
    write(target);
    written.push(join('project', path));
  };
  const text = (path: string, content: string) =>
    put(path, target => writeFileSync(target, content));
  const copy = (path: string, source: string) =>
    put(path, target => copyFileSync(join(root, source), target));
  const ranges = Object.fromEntries(
    files.map(({ path }, index) => {
      const source = resolve(root, 'app', path);

      return [
        fonts[index].file,
        rangeOf(dirname(dirname(source)), basename(source)),
      ];
    })
  ) as Record<string, string>;

  const controls = await buildControls(root);
  const script = `${bundleHeader(CONTROLS.map(({ name }) => name))}\n${controls.js}`;
  const styles = `${readFileSync(join(root, 'app/tokens.css'), 'utf8')}\n${controls.css}`;

  checkScript(script);
  checkStyle(styles);
  checkTypes(controls.types);
  rmSync(out, { force: true, recursive: true });
  text(`components/${BUNDLE_JS}`, script);
  text(`components/${BUNDLE_CSS}`, styles);
  text('components/index.d.ts', controls.types);
  text('design-system.json', json(systemIndex(sha, at)));
  text('tokens.json', json(system));
  text('tokens.css', systemCss(system, ranges));
  text('README.md', readme(design));

  for (const card of CARDS) {
    const page = previewHtml(card);
    const summary = controlReadme(
      card.name,
      controls.docs[card.name],
      designBullets(design, card.design)
    );

    checkReadme(card.name, summary);
    checkPreview(card.name, page);
    text(`components/${card.name}/README.md`, summary);
    text(`components/${card.name}/preview.html`, page);
  }

  text(
    'components/Cover/preview.html',
    readFileSync(join(root, 'lib/design/cover.html'), 'utf8')
  );

  for (const { path } of files) {
    copy(`fonts/${basename(path)}`, join('app', path));
  }

  copy('assets/Logos/icon0.svg', 'app/icon0.svg');

  for (const name of readdirSync(join(root, 'design/source')).toSorted()) {
    if (/^kse-.+\.svg$/.test(name)) {
      copy(`assets/Icons/${name}`, join('design/source', name));
    }
  }

  return written;
};

/* v8 ignore next 5 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  const written = await run(process.cwd(), OUTPUT);

  console.log(`Wrote ${written.length} files to ${OUTPUT}/project`);
}
