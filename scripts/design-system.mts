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

import type { Tree } from '../design/types.ts';

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
 * icons, README and cover. Returns the files written, relative to `out`. Two runs on one
 * commit write the same bytes: the timestamps are HEAD's commit time.
 */
export const run = (root: string, out: string): string[] => {
  const raw = JSON.parse(
    readFileSync(join(root, 'design/tokens.json'), 'utf8')
  ) as Tree;
  const files = fontFiles(readFileSync(join(root, 'app/layout.tsx'), 'utf8'));
  const fonts = systemFonts(files, raw);
  const system = systemTokens(raw, fonts);
  const sha = git(root, ['rev-parse', '--short=7', 'HEAD']);
  const at = new Date(
    Number(git(root, ['log', '-1', '--format=%ct'])) * 1000
  ).toISOString();
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

  rmSync(out, { force: true, recursive: true });
  text('design-system.json', json(systemIndex(sha, at)));
  text('tokens.json', json(system));
  text('tokens.css', systemCss(system, ranges));
  text(
    'README.md',
    readme(readFileSync(join(root, 'design/DESIGN.md'), 'utf8'))
  );
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
  const written = run(process.cwd(), OUTPUT);

  console.log(`Wrote ${written.length} files to ${OUTPUT}/project`);
}
