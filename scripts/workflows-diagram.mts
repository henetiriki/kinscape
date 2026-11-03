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

// One diagram per family; an event outside them fails the generator.
const FAMILIES: [string, string[]][] = [
  [
    'Pull requests',
    ['pull_request', 'pull_request_review', 'pull_request_review_comment'],
  ],
  ['Issues', ['issues', 'issue_comment']],
  ['Push, schedule and manual runs', ['push', 'schedule', 'workflow_dispatch']],
];

// Fill and stroke per name prefix, as `design/tokens.json` colour names; a prefix outside them fails the generator.
const FILLS: Record<string, [string, string]> = {
  Actions: ['error-bg', 'error-border'],
  Backlog: ['warning-bg', 'warning-border'],
  CI: ['info-bg', 'info-border'],
  Claude: ['brand-tint', 'brand'],
  Design: ['surface-2', 'line-strong'],
};

const FRONTMATTER = [
  '---',
  'config:',
  '  theme: redux-color',
  '  look: neo',
  '  layout: elk',
  '---',
];

const colours: Record<string, string> = JSON.parse(
  readFileSync(join(import.meta.dirname, '../design/tokens.json'), 'utf8')
).colour;

const id = (text: string) => text.replace(/\.ya?ml$/, '').replace(/\W/g, '_');

// Mermaid reads these as markup in a quoted label; its entity codes print them as text.
const escape = (text: string) =>
  text.replace(/"/g, '#quot;').replace(/</g, '#lt;').replace(/>/g, '#gt;');

// A pipe ends a table cell, a backslash would escape the next character, and angle brackets would open HTML.
const cell = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

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

// Every filter or schedule that narrows a trigger.
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
  const group = name.includes(':') ? name.split(':')[0] : name.split(' ')[0];

  if (!(group in FILLS)) {
    throw new Error(`${file}: no fill for the ${group} prefix`);
  }

  const triggers = Object.entries(on).map(
    ([event, config]): [string, string | undefined] => [
      event,
      narrowing(config),
    ]
  );

  for (const [event] of triggers) {
    if (
      event !== 'workflow_call' &&
      !FAMILIES.some(([, events]) => events.includes(event))
    ) {
      throw new Error(`${file}: no diagram family holds the ${event} event`);
    }
  }

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
    group,
    id: id(file),
    jobs: Object.keys(jobs),
    name,
    triggers,
  };
};

const table = (workflows: Workflow[]): string[] => {
  const names = new Map(workflows.map(({ id, name }) => [id, name]));

  return [
    '| Workflow | Trigger | Filter | Jobs |',
    '| --- | --- | --- | --- |',
    ...workflows.flatMap(({ calls, file, jobs, name, triggers }) => {
      const workflow = [
        `${cell(name)}<br>\`${file}\``,
        ...calls.map(call => `calls ${cell(names.get(call) ?? call)}`),
      ].join(' · ');

      return triggers.map(([event, filter], index) => {
        const cells = [
          index ? '' : workflow,
          event,
          filter ? `\`${cell(filter)}\`` : '',
          index ? '' : cell(jobs.join(' · ')),
        ];

        return `|${cells.map(text => (text ? ` ${text} ` : ' ')).join('|')}|`;
      });
    }),
  ];
};

const diagram = (
  workflows: Workflow[],
  [family, familyEvents]: [string, string[]]
): string[] => {
  const byId = new Map(workflows.map(workflow => [workflow.id, workflow]));
  const listens = (workflow: Workflow) =>
    workflow.triggers.some(([event]) => familyEvents.includes(event));
  const triggered = workflows.filter(listens);
  const nodes = [
    ...new Set([
      ...triggered,
      ...triggered.flatMap(({ calls }) =>
        calls.flatMap(call => {
          const called = byId.get(call);

          return called ? [called] : [];
        })
      ),
    ]),
  ];

  if (!nodes.length) {
    return [];
  }

  const events = [
    ...new Set(
      triggered.flatMap(({ triggers }) =>
        triggers
          .map(([event]) => event)
          .filter(event => familyEvents.includes(event))
      )
    ),
  ].sort();
  const groups = [...new Set(nodes.map(({ group }) => group))].sort();

  return [
    `## ${family}`,
    '',
    '```mermaid',
    ...FRONTMATTER,
    'flowchart TB',
    ...events.map(event => `  on_${id(event)}([${event}])`),
    ...nodes.map(({ id: node, name }) => `  ${node}["${escape(name)}"]`),
    ...events.flatMap(event =>
      nodes
        .filter(({ triggers }) => triggers.some(([e]) => e === event))
        .map(({ id: node }) => `  on_${id(event)} --> ${node}`)
    ),
    ...nodes.flatMap(({ calls, id: node }) =>
      calls
        .filter(call => byId.has(call))
        .map(call => `  ${node} -.->|calls| ${call}`)
    ),
    ...groups.map(group => {
      const [fill, stroke] = FILLS[group];

      return `  classDef ${id(group).toLowerCase()} fill:${colours[fill]},stroke:${colours[stroke]}`;
    }),
    ...groups.map(
      group =>
        `  class ${nodes
          .filter(node => node.group === group)
          .map(({ id }) => id)
          .join(',')} ${id(group).toLowerCase()}`
    ),
    '```',
    '',
  ];
};

/** Reads every workflow under `root` and returns the Markdown that `.github/workflows/README.md` must hold. */
export const generate = (root: string): string => {
  const workflows = readdirSync(join(root, DIR))
    .filter(file => file.endsWith('.yml'))
    .sort()
    .map(file => read(root, file));

  return [
    "<!-- Written by `npm run workflows:diagram` from the workflow files. Don't edit it by hand. -->",
    '',
    '# Workflows',
    '',
    'What starts each GitHub Actions workflow, its jobs, and the reusable workflows it calls. How the team uses them: [the README](../../README.md#how-we-work).',
    '',
    ...table(workflows),
    '',
    ...FAMILIES.flatMap(family => diagram(workflows, family)),
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
