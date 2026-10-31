import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, sep } from 'node:path';

import type { AssetRecord, DesignIndex } from './types.ts';

const INDEX = 'project/design-system.json';
const SUMS = 'project/checksums.json';
const ARTIFACT = /^https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+$/;
const USAGE =
  'Usage: design-system-publish.mts address | checksums | changed [published checksums.json] | stamp --by <name> [--published <index.json>] [--uploads <uploads.json>]';

type Records = Record<string, Record<string, AssetRecord>>;

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const readJson = <T,>(path: string): T =>
  JSON.parse(readFileSync(path, 'utf8')) as T;

/** Every file under `dir`, as `/`-separated paths relative to it, in name order. */
const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry =>
      join(entry.parentPath, entry.name)
        .slice(dir.length + 1)
        .split(sep)
        .join('/')
    )
    .toSorted();

/**
 * The artifact's link: the `[design system](…)` link in `DESIGN.md`'s opening paragraph
 * (the canvas link beside it is not one). `undefined` when there is none; throws when there
 * are two, or the one there is isn't a `https://claude.ai/artifact/<id>` link.
 */
export const address = (designMd: string): string | undefined => {
  const opening = designMd.split(/\n\s*\n/)[1] ?? '';
  const links = [...opening.matchAll(/\[design system\]\(([^)]*)\)/gi)].map(
    match => match[1]
  );

  if (links.length > 1) {
    throw new Error(
      'DESIGN.md: more than one design system link in the opening paragraph'
    );
  }

  if (links.length === 1 && !ARTIFACT.test(links[0])) {
    throw new Error(
      `DESIGN.md: the design system link is not a claude.ai artifact link: ${links[0]}`
    );
  }

  return links[0];
};

/** SHA-256 of each file under `project`, keyed `project/<path>`, except the index and the checksums. */
export const checksums = (project: string): Record<string, string> =>
  Object.fromEntries(
    filesUnder(project)
      .map(path => `project/${path}`)
      .filter(path => path !== INDEX && path !== SUMS)
      .map(path => [
        path,
        createHash('sha256')
          .update(readFileSync(join(project, path.slice('project/'.length))))
          .digest('hex'),
      ])
  );

/** The paths in `current` whose hash differs from `published` (all of them when nothing is). */
export const changed = (
  current: Record<string, string>,
  published: Record<string, string> | undefined
): string[] =>
  Object.keys(current)
    .toSorted()
    .filter(path => published?.[path] !== current[path]);

/** What to send: the changed files, `checksums.json` if any file changed or went, then the index. */
export const sendList = (
  current: Record<string, string>,
  published: Record<string, string> | undefined
): string[] => {
  const files = changed(current, published);
  const removed = Object.keys(published ?? {}).some(path => !(path in current));

  return [...files, ...(files.length > 0 || removed ? [SUMS] : []), INDEX];
};

/** A name with bytes outside `[A-Za-z0-9_./-]` written `~` and two hex digits, as the index's file keys are. */
const recordKey = (name: string): string =>
  [...Buffer.from(name)]
    .map(byte => {
      const char = String.fromCharCode(byte);

      return /[A-Za-z0-9_./-]/.test(char)
        ? char
        : `~${byte.toString(16).padStart(2, '0')}`;
    })
    .join('');

/**
 * The index records for every file under `project/assets/<Group>/`. Each takes the blob id
 * of its upload (`uploads`, keyed `project/assets/<Group>/<name>`), else the one the
 * artifact's `published` index holds; with neither it throws, naming the file.
 */
export const assetRecords = (
  project: string,
  published: DesignIndex | undefined,
  uploads: Record<string, string>
): Records => {
  const records: Records = {};

  for (const path of filesUnder(join(project, 'assets'))) {
    const [group, ...rest] = path.split('/');
    const name = rest.join('/');
    const key = recordKey(name);
    const system = `project/assets/${path}`;
    const blob =
      uploads[system] ?? published?.assetGroups[group]?.files[key]?.blob;

    if (extname(name) !== '.svg') {
      throw new Error(`${system}: only SVG assets are published`);
    }

    if (blob === undefined) {
      throw new Error(`${system}: no upload and no published record`);
    }

    records[group] ??= {};
    records[group][key] = {
      blob,
      name,
      size: statSync(join(project, 'assets', path)).size,
      type: 'image/svg+xml',
    };
  }

  return records;
};

/** The generated index with `lastChange.by` set to who ran it and each group's files and order filled in. */
export const stamp = (
  index: DesignIndex,
  by: string,
  records: Records
): DesignIndex => ({
  ...index,
  assetGroups: Object.fromEntries(
    Object.entries(index.assetGroups).map(([group, entry]) => {
      const files = records[group] ?? {};

      return [group, { ...entry, files, order: Object.keys(files).toSorted() }];
    })
  ),
  lastChange: { ...index.lastChange, by },
});

/**
 * The script's subcommands, each returning the lines it prints. `root` holds `design/`, `out`
 * the generator's output folder.
 */
export const cli = (
  args: string[],
  root = '.',
  out = '.design-system'
): string[] => {
  const [command, ...rest] = args;
  const flag = (name: string): string | undefined => {
    const at = rest.indexOf(name);

    return at === -1 ? undefined : rest[at + 1];
  };
  const project = join(out, 'project');

  switch (command) {
    case 'address': {
      const link = address(
        readFileSync(join(root, 'design/DESIGN.md'), 'utf8')
      );

      return link === undefined ? [] : [link];
    }

    case 'changed': {
      if (!existsSync(join(out, SUMS))) {
        throw new Error('Run `checksums` first');
      }

      return sendList(
        readJson(join(out, SUMS)),
        rest[0] === undefined ? undefined : readJson(rest[0])
      );
    }

    case 'checksums':
      writeFileSync(join(out, SUMS), json(checksums(project)));

      return [SUMS];

    case 'stamp': {
      const by = flag('--by');
      const published = flag('--published');
      const uploads = flag('--uploads');

      if (by === undefined) {
        throw new Error('stamp needs --by <name>');
      }

      writeFileSync(
        join(out, INDEX),
        json(
          stamp(
            readJson(join(out, INDEX)),
            by,
            assetRecords(
              project,
              published === undefined ? undefined : readJson(published),
              uploads === undefined ? {} : readJson(uploads)
            )
          )
        )
      );

      return [INDEX];
    }

    default:
      throw new Error(USAGE);
  }
};

/* v8 ignore next 10 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  try {
    for (const line of cli(process.argv.slice(2))) {
      console.log(line);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
