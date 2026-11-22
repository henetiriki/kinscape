import type { Gh } from '#ks/scripts/types.ts';

// Reads a list from the GitHub API, all pages, as one JSON value per line. `--jq` runs on each page,
// so `.[] | @json` gives one line per item and the pages join with no array to merge.
export const ghList = <T,>(gh: Gh, path: string): T[] =>
  gh(['api', '--paginate', path, '--jq', '.[] | @json'])
    .split('\n')
    .filter(line => line !== '')
    .map(line => JSON.parse(line) as T);
