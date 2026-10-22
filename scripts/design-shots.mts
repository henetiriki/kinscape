import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export type Deps = {
  /** Renders the page at `url` to JPG bytes; rejects on any non-`file:` request. */
  shoot: (url: string, shot: Shot) => Promise<Uint8Array>;
};

export type Shot = {
  fullPage: boolean;
  height: number;
  scale: number;
  width: number;
};

const SOURCE_DIR = 'design/source';

/** The phone boards are long pages; every other phone file is one screen. */
const PHONE_BOARD = /^(?:style-\d.*|map-style|design-kit)-phone$/;

/** Phone screens, style guide boards and the map style board each have their own size. */
export const shotFor = (name: string): Shot => {
  if (name.includes('phone')) {
    return {
      fullPage: PHONE_BOARD.test(name),
      height: 844,
      scale: 2,
      width: 390,
    };
  }

  if (name.startsWith('style-') || name === 'map-style') {
    return { fullPage: true, height: 900, scale: 1, width: 1440 };
  }

  return { fullPage: false, height: 900, scale: 1, width: 1440 };
};

export const snapshotNames = (root: string): string[] =>
  readdirSync(join(root, SOURCE_DIR))
    .filter(file => file.endsWith('.html'))
    .map(file => file.slice(0, -'.html'.length))
    .toSorted();

/** The JPG names in the `DESIGN.md` Screens table, without the extension. */
export const screenNames = (designMd: string): string[] =>
  [...designMd.matchAll(/^\|[^|\n]*\| \[([^\]]+)\.jpg\]\(/gm)].map(
    match => match[1]
  );

const FORBIDDEN: [string, RegExp][] = [
  ['<script', /<script/i],
  ['var(', /var\(/i],
  ['calc(', /calc\(/i],
  ['an http(s) load', /(?:src|href)=["']https?:|url\(\s*["']?https?:|@import/i],
];

const REFERENCE = /(?:src|href)="([^"]*)"|url\(\s*["']?([^"')\s]*)/g;

const referenceProblems = (dir: string, name: string, html: string) => {
  const problems: string[] = [];

  for (const match of html.matchAll(REFERENCE)) {
    const ref = match[1] ?? match[2];

    if (ref === '' || ref === '#' || /^(?:https?:|data:)/.test(ref)) {
      continue;
    }

    if (ref.startsWith('#')) {
      if (!html.includes(`id="${ref.slice(1)}"`)) {
        problems.push(`${name}.html: ${ref} matches no id`);
      }
    } else if (!existsSync(resolve(dir, ref.split(/[?#]/)[0]))) {
      problems.push(`${name}.html: ${ref} does not resolve`);
    }
  }

  return problems;
};

/** Everything wrong with the snapshots under `root`; empty when they are sound. */
export const findProblems = (root: string): string[] => {
  const dir = join(root, SOURCE_DIR);
  const screens = screenNames(
    readFileSync(join(root, 'design/DESIGN.md'), 'utf8')
  );
  const snapshots = snapshotNames(root);
  const problems: string[] = [];

  for (const name of screens) {
    if (!snapshots.includes(name)) {
      problems.push(`${name}: no snapshot in ${SOURCE_DIR}`);
    }

    if (!existsSync(join(root, 'design', `${name}.jpg`))) {
      problems.push(`${name}: no design/${name}.jpg`);
    }
  }

  for (const name of snapshots) {
    if (!screens.includes(name)) {
      problems.push(`${name}.html: no row in the DESIGN.md Screens table`);
    }

    const html = readFileSync(join(dir, `${name}.html`), 'utf8');

    for (const [label, pattern] of FORBIDDEN) {
      if (pattern.test(html)) {
        problems.push(`${name}.html: contains ${label}`);
      }
    }

    problems.push(...referenceProblems(dir, name, html));
  }

  return problems;
};

const sameBytes = (path: string, bytes: Uint8Array): boolean =>
  existsSync(path) && Buffer.compare(readFileSync(path), bytes) === 0;

/** Renders the named snapshots (all when none are named); returns the JPGs that changed. */
export const render = async (
  root: string,
  names: string[],
  deps: Deps
): Promise<string[]> => {
  const all = snapshotNames(root);
  const unknown = names.filter(name => !all.includes(name));

  if (unknown.length > 0) {
    throw new Error(`No snapshot named: ${unknown.join(', ')}`);
  }

  const changed: string[] = [];

  for (const name of names.length > 0 ? names : all) {
    const url = pathToFileURL(resolve(root, SOURCE_DIR, `${name}.html`)).href;
    const bytes = await deps.shoot(url, shotFor(name));
    const target = join(root, 'design', `${name}.jpg`);

    if (!sameBytes(target, bytes)) {
      writeFileSync(target, bytes);
      changed.push(name);
    }
  }

  return changed;
};

/* v8 ignore start -- launches Chromium; only runs when invoked directly */
if (import.meta.main) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();

  try {
    const changed = await render('.', process.argv.slice(2), {
      shoot: async (url, { fullPage, height, scale, width }) => {
        const page = await browser.newPage({
          deviceScaleFactor: scale,
          viewport: { height, width },
        });
        const blocked: string[] = [];

        await page.route(
          target => target.protocol !== 'file:',
          route => {
            blocked.push(route.request().url());

            return route.abort();
          }
        );
        await page.goto(url);
        await page.evaluate(() => document.fonts.ready);

        const bytes = await page.screenshot({
          fullPage,
          quality: 90,
          type: 'jpeg',
        });

        await page.close();

        if (blocked.length > 0) {
          throw new Error(`${url} requested ${blocked.join(', ')}`);
        }

        return bytes;
      },
    });

    console.log(
      changed.length > 0 ? `Rewrote: ${changed.join(', ')}` : 'No JPG changed.'
    );
  } finally {
    await browser.close();
  }
}
/* v8 ignore stop */
