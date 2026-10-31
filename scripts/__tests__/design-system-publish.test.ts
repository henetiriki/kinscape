import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DesignIndex } from '../types.ts';

import {
  address,
  assetRecords,
  changed,
  checksums,
  cli,
  sendList,
  stamp,
} from '../design-system-publish.mts';
import { run } from '../design-system.mts';

const LINK = 'https://claude.ai/artifact/AbC123xyz';
const INDEX = 'project/design-system.json';
const SUMS = 'project/checksums.json';

let out: string;
let project: string;
let sums: Record<string, string>;
let icons: string[];

const read = (path: string): string => readFileSync(join(out, path), 'utf8');

const write = (root: string, path: string, content: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const uploadsFor = (paths: string[]): Record<string, string> =>
  Object.fromEntries(paths.map((path, index) => [path, `blob${index}`]));

beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), 'design-system-publish-'));
  run('.', out);
  project = join(out, 'project');
  sums = checksums(project);
  icons = Object.keys(sums).filter(path => path.startsWith('project/assets/'));
});

afterAll(() => {
  rmSync(out, { force: true, recursive: true });
});

describe('address', () => {
  const doc = (paragraph: string, rest = ''): string =>
    `# KinScape design\n\n${paragraph}\n\n## Screens\n\n${rest}\n`;

  it('reads the design system link in the opening paragraph, not the canvas link', () => {
    expect(
      address(
        doc(
          `The [design canvas](https://claude.ai/artifact/Canvas1) and the [design system](${LINK}).`
        )
      )
    ).toBe(LINK);
  });

  it('is undefined when the opening paragraph has none, even if a later section does', () => {
    expect(
      address(
        doc(
          'The [design canvas](https://claude.ai/artifact/Canvas1).',
          `[design system](${LINK})`
        )
      )
    ).toBeUndefined();
  });

  it.each([
    'https://example.com/artifact/AbC123',
    'https://claude.ai/artifact/',
    `${LINK}?x=1`,
    `${LINK}/`,
  ])('stops on a design system link that is not an artifact link: %s', url => {
    expect(() => address(doc(`See the [design system](${url}).`))).toThrow(
      /design system link/
    );
  });

  it('is undefined for a document with only a title', () => {
    expect(address('# KinScape design')).toBeUndefined();
  });

  it('stops when the opening paragraph has two design system links', () => {
    expect(() =>
      address(doc(`[design system](${LINK}) and [design system](${LINK}).`))
    ).toThrow(/more than one/);
  });
});

describe('checksums', () => {
  it('hashes every file under project/ except the index and itself', () => {
    expect(Object.keys(sums)).toContain('project/tokens.json');
    expect(Object.keys(sums)).toContain(
      'project/fonts/jetbrains-mono-latin-400-normal.woff2'
    );
    expect(Object.keys(sums)).not.toContain(INDEX);
    expect(Object.keys(sums)).not.toContain(SUMS);
    expect(Object.values(sums).every(hash => /^[0-9a-f]{64}$/.test(hash))).toBe(
      true
    );
    expect(icons).toHaveLength(11);
  });

  it('gives the same hashes for the same bytes', () => {
    expect(checksums(project)).toEqual(sums);
  });
});

describe('changed', () => {
  it('is empty when nothing differs', () => {
    expect(changed(sums, { ...sums })).toEqual([]);
  });

  it('lists every file on a first run', () => {
    expect(changed(sums, undefined)).toEqual(Object.keys(sums).toSorted());
  });

  it('lists the two token files when one colour changes', () => {
    const colour = {
      ...sums,
      'project/tokens.css': 'x',
      'project/tokens.json': 'y',
    };

    expect(changed(sums, colour)).toEqual([
      'project/tokens.css',
      'project/tokens.json',
    ]);
  });

  it('lists a file the artifact does not have yet', () => {
    const rest = Object.fromEntries(
      Object.entries(sums).filter(([path]) => path !== 'project/README.md')
    );

    expect(changed(sums, rest)).toEqual(['project/README.md']);
  });
});

describe('sendList', () => {
  it('is only the index when nothing differs', () => {
    expect(sendList(sums, { ...sums })).toEqual([INDEX]);
  });

  it('is the changed files, then the checksums, then the index', () => {
    expect(sendList(sums, { ...sums, 'project/tokens.css': 'x' })).toEqual([
      'project/tokens.css',
      SUMS,
      INDEX,
    ]);
  });

  it('sends the checksums when only a file was removed', () => {
    expect(sendList(sums, { ...sums, 'project/gone.txt': 'x' })).toEqual([
      SUMS,
      INDEX,
    ]);
  });

  it('is everything on a first run', () => {
    expect(sendList(sums, undefined)).toEqual([
      ...Object.keys(sums).toSorted(),
      SUMS,
      INDEX,
    ]);
  });
});

describe('assetRecords', () => {
  const published = (blobs: Record<string, string>): DesignIndex => {
    const index = JSON.parse(read(INDEX)) as DesignIndex;

    for (const [path, blob] of Object.entries(blobs)) {
      const [, , group, name] = path.split('/');

      index.assetGroups[group].files[name] = {
        blob,
        name,
        size: 1,
        type: 'image/svg+xml',
      };
    }

    return index;
  };

  it('records each upload with its size and media type', () => {
    const records = assetRecords(project, undefined, uploadsFor(icons));
    const mark = records.Logos['icon0.svg'];

    expect(Object.keys(records.Icons)).toHaveLength(10);
    expect(mark.type).toBe('image/svg+xml');
    expect(mark.name).toBe('icon0.svg');
    expect(mark.size).toBe(
      statSync(join(project, 'assets/Logos/icon0.svg')).size
    );
    expect(mark.blob).toBe(
      `blob${icons.indexOf('project/assets/Logos/icon0.svg')}`
    );
  });

  it('keeps the published record of an icon that was not uploaded', () => {
    const [first, ...rest] = icons;
    const records = assetRecords(
      project,
      published({ [first]: 'old' }),
      uploadsFor(rest)
    );
    const [, , group, name] = first.split('/');

    expect(records[group][name].blob).toBe('old');
  });

  it('takes the new upload over the published record', () => {
    const records = assetRecords(
      project,
      published({ [icons[0]]: 'old' }),
      uploadsFor(icons)
    );
    const [, , group, name] = icons[0].split('/');

    expect(records[group][name].blob).toBe('blob0');
  });

  it('stops naming an icon with no upload and no published record', () => {
    expect(() =>
      assetRecords(project, undefined, uploadsFor(icons.slice(1)))
    ).toThrow(icons[0]);
  });

  it('stops on an asset that is not an SVG', () => {
    const root = mkdtempSync(join(tmpdir(), 'design-system-publish-png-'));

    try {
      write(root, 'assets/Icons/a.png', 'x');

      expect(() =>
        assetRecords(root, undefined, { 'project/assets/Icons/a.png': 'id' })
      ).toThrow(/only SVG/);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('writes a name with bytes outside [A-Za-z0-9_./-] as ~ and two hex digits', () => {
    const root = mkdtempSync(join(tmpdir(), 'design-system-publish-name-'));

    try {
      write(root, 'assets/Icons/a b.svg', '<svg/>');

      expect(
        assetRecords(root, undefined, { 'project/assets/Icons/a b.svg': 'id' })
      ).toEqual({
        Icons: {
          'a~20b.svg': {
            blob: 'id',
            name: 'a b.svg',
            size: 6,
            type: 'image/svg+xml',
          },
        },
      });
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe('stamp', () => {
  it('sets who ran it and fills in the icon records, in name order', () => {
    const index = JSON.parse(read(INDEX)) as DesignIndex;
    const records = assetRecords(project, undefined, uploadsFor(icons));
    const stamped = stamp(index, 'Test Person', records);

    expect(stamped.lastChange).toEqual({
      ...index.lastChange,
      by: 'Test Person',
    });
    expect(stamped.assetGroups.Logos.order).toEqual(['icon0.svg']);
    expect(stamped.assetGroups.Icons.order).toEqual(
      Object.keys(records.Icons).toSorted()
    );
    expect(stamped.assetGroups.Icons.files).toEqual(records.Icons);
    expect(stamped.title).toBe('KinScape');
    expect(stamped.editing).toBe('code');
    expect(index.lastChange.by).toBe('KinScape repo');
  });
});

describe('stamp with no records', () => {
  it('empties each group', () => {
    const index = JSON.parse(read(INDEX)) as DesignIndex;
    const stamped = stamp(index, 'Test Person', {});

    expect(stamped.assetGroups.Icons.files).toEqual({});
    expect(stamped.assetGroups.Icons.order).toEqual([]);
  });
});

describe('cli', () => {
  let root: string;
  let dir: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'design-system-publish-root-'));
    dir = mkdtempSync(join(tmpdir(), 'design-system-publish-out-'));
    run('.', dir);
    write(
      root,
      'design/DESIGN.md',
      `# KinScape design\n\nThe [design system](${LINK}).\n\n## Screens\n`
    );
  });

  afterAll(() => {
    rmSync(root, { force: true, recursive: true });
    rmSync(dir, { force: true, recursive: true });
  });

  it('address prints the link, or nothing when there is none', () => {
    expect(cli(['address'], root, dir)).toEqual([LINK]);

    write(root, 'design/DESIGN.md', '# KinScape design\n\nNo link.\n');

    expect(cli(['address'], root, dir)).toEqual([]);
  });

  it('checksums writes project/checksums.json', () => {
    expect(cli(['checksums'], root, dir)).toEqual([SUMS]);
    expect(
      JSON.parse(readFileSync(join(dir, SUMS), 'utf8')) as Record<
        string,
        string
      >
    ).toEqual(checksums(join(dir, 'project')));
  });

  it('changed lists everything with no published file, and only the index when it matches', () => {
    const list = cli(['changed'], root, dir);

    expect(list.at(-1)).toBe(INDEX);
    expect(list.at(-2)).toBe(SUMS);
    expect(list).toContain('project/tokens.json');

    expect(cli(['changed', join(dir, SUMS)], root, dir)).toEqual([INDEX]);
  });

  it('changed stops when checksums has not run', () => {
    const empty = mkdtempSync(join(tmpdir(), 'design-system-publish-empty-'));

    try {
      expect(() => cli(['changed'], root, empty)).toThrow(/checksums/);
    } finally {
      rmSync(empty, { force: true, recursive: true });
    }
  });

  it('stamp writes the index with who ran it and the icon records', () => {
    const uploads = join(dir, 'uploads.json');

    writeFileSync(uploads, JSON.stringify(uploadsFor(icons)));

    expect(
      cli(['stamp', '--by', 'Test Person', '--uploads', uploads], root, dir)
    ).toEqual([INDEX]);

    const index = JSON.parse(
      readFileSync(join(dir, INDEX), 'utf8')
    ) as DesignIndex;

    expect(index.lastChange.by).toBe('Test Person');
    expect(Object.keys(index.assetGroups.Icons.files)).toHaveLength(10);
  });

  it('stamp reads icons the artifact already holds from --published', () => {
    const published = join(dir, 'published.json');

    writeFileSync(published, readFileSync(join(dir, INDEX), 'utf8'));

    cli(['stamp', '--by', 'Again', '--published', published], root, dir);

    expect(
      (JSON.parse(readFileSync(join(dir, INDEX), 'utf8')) as DesignIndex)
        .assetGroups.Logos.files['icon0.svg'].blob
    ).toBe(
      (JSON.parse(readFileSync(published, 'utf8')) as DesignIndex).assetGroups
        .Logos.files['icon0.svg'].blob
    );
  });

  it('stamp needs --by', () => {
    expect(() => cli(['stamp'], root, dir)).toThrow(/--by/);
  });

  it('stops on an unknown subcommand', () => {
    expect(() => cli(['publish'], root, dir)).toThrow(/address \| checksums/);
  });
});
