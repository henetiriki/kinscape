import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';

// Each entry lists the files of the link cycles it allows. A cycle passes when
// one entry holds every file on it, and an entry that holds no whole cycle fails.
export const ALLOWLIST: string[][] = [
  [
    '.claude/skills/refine/SKILL.md',
    '.claude/skills/refine/chore.md',
    '.claude/skills/refine/intent.md',
    '.claude/skills/refine/spec.md',
  ],
  ['docs/building.md', 'docs/how-we-work.md'],
  // Temporary: a later Chore removes each entry below.
  [
    'AGENTS.md',
    'design/DESIGN.md',
    'docs/architecture-target.md',
    'docs/architecture.md',
    'docs/how-we-work.md',
    'docs/security.md',
  ],
  ['.github/workflows/README.md', 'README.md'],
];

const FENCE = /^ {0,3}(`{3,}|~{3,}).*\n[\s\S]*?^ {0,3}\1[`~]*[ \t]*$/gm;
const CODE_SPAN = /(`+)[\s\S]*?\1/g;
const MARKDOWN_LINK = /\]\(\s*<?([^)\s>]*)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const IMPORT = /^@(\S+\.md)\s*$/gm;
const HTML_SOURCE = /\b(?:src|srcset)="([^"]+)"/g;
const HEADING = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/gm;
const HTML_ANCHOR = /<a\s+(?:id|name)="([^"]+)"/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

const withoutFences = (text: string) => text.replace(FENCE, '');

const targetsOf = (text: string): string[] => {
  const plain = withoutFences(text).replace(CODE_SPAN, '');

  return [
    ...[...plain.matchAll(MARKDOWN_LINK)].map(match => match[1]),
    ...[...plain.matchAll(IMPORT)].map(match => match[1]),
    ...[...plain.matchAll(HTML_SOURCE)].flatMap(match =>
      match[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0])
    ),
  ];
};

// The anchors GitHub gives a heading: lower case, punctuation dropped, spaces
// to hyphens, and `-1`, `-2` on repeats. A `<a id>` or `<a name>` adds one more.
const anchorsOf = (text: string): Set<string> => {
  const plain = withoutFences(text);
  const seen = new Map<string, number>();
  const anchors = new Set<string>();

  for (const [, heading] of plain.matchAll(HEADING)) {
    const slug = heading
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const count = seen.get(slug) ?? 0;

    seen.set(slug, count + 1);
    anchors.add(count === 0 ? slug : `${slug}-${count}`);
  }

  for (const [, id] of plain.matchAll(HTML_ANCHOR)) {
    anchors.add(id);
  }

  return anchors;
};

// Every simple cycle, each once, listed from its first file in `files` order.
const cyclesOf = (files: string[], edges: Map<string, Set<string>>) => {
  const cycles: string[][] = [];

  files.forEach((start, startIndex) => {
    const allowed = new Set(files.slice(startIndex));
    const walk = (path: string[]) => {
      for (const next of edges.get(path[path.length - 1]) as Set<string>) {
        if (next === start) {
          cycles.push(path);
        } else if (allowed.has(next) && !path.includes(next)) {
          walk([...path, next]);
        }
      }
    };

    walk([start]);
  });

  return cycles;
};

export const checkDocLinks = (
  root: string,
  files: string[],
  allowlist: string[][]
): string[] => {
  const errors: string[] = [];
  const edges = new Map<string, Set<string>>();
  const anchorCache = new Map<string, Set<string>>();

  const anchorsIn = (file: string) => {
    if (!anchorCache.has(file)) {
      anchorCache.set(file, anchorsOf(readFileSync(`${root}/${file}`, 'utf8')));
    }

    return anchorCache.get(file) as Set<string>;
  };

  for (const file of files) {
    const text = readFileSync(`${root}/${file}`, 'utf8');
    const linked = new Set<string>();

    for (const raw of targetsOf(text)) {
      if (EXTERNAL.test(raw)) {
        continue;
      }

      const [location, anchor] = raw.split('#').map(decodeURIComponent);
      const written = location.split('?')[0];
      const target =
        written === ''
          ? file
          : posix.normalize(posix.join(posix.dirname(file), written));

      if (!existsSync(`${root}/${target}`)) {
        errors.push(`${file}: ${written} does not exist`);
      } else if (
        anchor &&
        target.endsWith('.md') &&
        !anchorsIn(target).has(anchor)
      ) {
        errors.push(`${file}: no heading "#${anchor}" in ${target}`);
      } else if (target !== file) {
        linked.add(target);
      }
    }

    edges.set(file, linked);
  }

  const cycles = cyclesOf(files, edges);
  const used = new Set<string[]>();

  for (const cycle of cycles) {
    const holding = allowlist.filter(entry =>
      cycle.every(file => entry.includes(file))
    );

    holding.forEach(entry => used.add(entry));

    if (holding.length === 0) {
      errors.push(
        `link cycle not on the allowlist: ${[...cycle, cycle[0]].join(' > ')}`
      );
    }
  }

  for (const entry of allowlist.filter(entry => !used.has(entry))) {
    errors.push(`allowlist entry matches no link cycle: ${entry.join(', ')}`);
  }

  return errors;
};

// Tracked Markdown files, except plans and the two design copies.
export const docFiles = (root: string): string[] =>
  execFileSync('git', ['ls-files', '-z', '*.md'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(
      path =>
        path !== '' && !/^(?:plans|design\/canvas|design\/source)\//.test(path)
    );
