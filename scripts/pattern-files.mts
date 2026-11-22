import { posix } from 'node:path';
import { parse } from 'yaml';

import type { PatternFile, PlanNewDeps } from '#ks/scripts/types.ts';

// The pattern files of docs/patterns/ and the paths that load each as a rule
// (see docs/patterns/). `npm run plan:new` lists the files that match what an issue
// cites; scripts/__tests__/pattern-files.test.ts checks the files themselves.

const FOLDER = 'docs/patterns';
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const CODE_SPAN = /`([^`\n]+)`/g;
const LINE_SUFFIX = /:\d+(?:-\d+)?$/;
const PATH = /^[\w@.-]+(?:\/[\w@.-]+)*\/?$/;
const FILE_EXTENSION = /\.[a-z]\w*$/i;

/** The globs of the `paths:` list in the frontmatter of a rule file, or none. */
export const globsOf = (text: string): string[] => {
  const header = FRONTMATTER.exec(text)?.[1] ?? '';
  const paths = (parse(header) as { paths?: unknown } | null)?.paths;

  return Array.isArray(paths)
    ? paths.filter((path): path is string => typeof path === 'string')
    : [];
};

export const patternFiles = ({
  list,
  read,
}: Pick<PlanNewDeps['files'], 'list' | 'read'>): PatternFile[] =>
  list(FOLDER)
    .filter(name => name.endsWith('.md'))
    .map(name => ({
      globs: globsOf(read(`${FOLDER}/${name}`)),
      path: `${FOLDER}/${name}`,
    }));

/** The code spans of a text that name a file or a folder, without a `:<line>` suffix, once each. */
export const citedPaths = (body: string): string[] => [
  ...new Set(
    Array.from(body.matchAll(CODE_SPAN), ([, span]) =>
      span.replace(LINE_SUFFIX, '')
    ).filter(
      span =>
        PATH.test(span) && (span.includes('/') || FILE_EXTENSION.test(span))
    )
  ),
];

/** A cited file matches a glob. A cited folder (ending in `/`) matches a glob under it or one that covers it. */
export const matches = (cited: string, globs: string[]): boolean =>
  cited.endsWith('/')
    ? globs.some(
        glob => glob.startsWith(cited) || posix.matchesGlob(`${cited}x`, glob)
      )
    : globs.some(glob => posix.matchesGlob(cited, glob));

/** The path of each pattern file whose globs match a path that the text cites. */
export const patternsFor = (body: string, files: PatternFile[]): string[] => {
  const cited = citedPaths(body);

  return files
    .filter(({ globs }) => cited.some(path => matches(path, globs)))
    .map(({ path }) => path);
};
