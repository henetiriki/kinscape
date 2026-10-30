import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

type Trigger = {
  cron?: string;
} & Partial<Record<(typeof FILTERS)[number], string[]>>;

type Workflow = {
  calls: string[];
  file: string;
  group: string;
  id: string;
  jobs: string[];
  name: string;
  triggers: [string, string | undefined][];
};

const DIR = '.github/workflows';
const OUT = `${DIR}/README.md`;

// A reusable workflow, called by path, pinned (owner/repo/…@sha) or local (./…).
const CALL = /\.github\/workflows\/([\w.-]+\.ya?ml)/;

const id = (text: string) => text.replace(/\.ya?ml$/, '').replace(/\W/g, '_');

// Mermaid reads these as markup in a quoted label; its entity codes print them as text.
const escape = (text: string) =>
  text.replace(/"/g, '#quot;').replace(/</g, '#lt;').replace(/>/g, '#gt;');

// Types and branches are shown bare; the other filters carry their key.
const FILTERS = [
  'types',
  'branches',
  'branches-ignore',
  'tags',
  'tags-ignore',
  'paths',
  'paths-ignore',
] as const;

// Every filter or schedule that narrows a trigger, as its edge label.
const narrowing = (config: unknown): string | undefined => {
  if (Array.isArray(config)) {
    return config.map((entry: Trigger) => entry.cron).join(', ');
  }

  const trigger = (config ?? {}) as Trigger;
  const parts = FILTERS.flatMap(key => {
    const list = trigger[key];

    if (!list) {
      return [];
    }

    return [
      key === 'types' || key === 'branches'
        ? list.join(', ')
        : `${key}: ${list.join(', ')}`,
    ];
  });

  return parts.length ? parts.join(' · ') : undefined;
};

const read = (root: string, file: string): Workflow => {
  const doc = parse(readFileSync(join(root, DIR, file), 'utf8'));
  const name: string = doc.name ?? file;
  const on: Record<string, unknown> =
    typeof doc.on === 'string'
      ? { [doc.on]: null }
      : Array.isArray(doc.on)
        ? Object.fromEntries(doc.on.map((event: string) => [event, null]))
        : doc.on;
  const jobs: Record<string, { uses?: string }> = doc.jobs;

  return {
    calls: [
      ...new Set(
        Object.values(jobs).flatMap(job => {
          const match = job.uses?.match(CALL);

          return match ? [id(match[1])] : [];
        })
      ),
    ],
    file,
    group: name.includes(':') ? name.split(':')[0] : name.split(' ')[0],
    id: id(file),
    jobs: Object.keys(jobs),
    name,
    triggers: Object.entries(on)
      .filter(([event]) => event !== 'workflow_call')
      .map(([event, config]) => [event, narrowing(config)]),
  };
};

/** Reads every workflow under `root` and returns the Markdown that `.github/workflows/README.md` must hold. */
export const generate = (root: string): string => {
  const workflows = readdirSync(join(root, DIR))
    .filter(file => file.endsWith('.yml'))
    .sort()
    .map(file => read(root, file));
  const groups = [...new Set(workflows.map(({ group }) => group))];
  const events = [
    ...new Set(workflows.flatMap(({ triggers }) => triggers.map(([e]) => e))),
  ].sort();

  const lines = [
    'flowchart LR',
    ...events.map(event => `  on_${id(event)}([${event}])`),
    ...groups.flatMap(group => [
      `  subgraph g_${id(group)} [${escape(group)}]`,
      ...workflows
        .filter(workflow => workflow.group === group)
        .map(
          ({ file, id: node, jobs, name }) =>
            `    ${node}["${escape(name)}<br>${file}<br>${jobs.join(' · ')}"]`
        ),
      '  end',
    ]),
    ...workflows.flatMap(({ id: node, triggers }) =>
      triggers.map(([event, label]) =>
        label
          ? `  on_${id(event)} -->|"${escape(label)}"| ${node}`
          : `  on_${id(event)} --> ${node}`
      )
    ),
    ...workflows.flatMap(({ calls, id: node }) =>
      calls.map(call => `  ${node} -.->|calls| ${call}`)
    ),
  ];

  return [
    "<!-- Written by `npm run workflows:diagram` from the workflow files. Don't edit it by hand. -->",
    '',
    '# Workflows',
    '',
    'What starts each GitHub Actions workflow, its jobs, and the reusable workflows it calls. How the team uses them: [the README](../../README.md#how-we-work).',
    '',
    '```mermaid',
    ...lines,
    '```',
    '',
  ].join('\n');
};

/** Writes `.github/workflows/README.md` under `root`. */
export const run = (root: string): number => {
  writeFileSync(join(root, OUT), generate(root));

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.cwd());
}
