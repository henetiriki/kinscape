import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Usage: npm run plan-approve -- <plan file> <reviewer login> D1=A "D2=other: <text>"
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

type Answer = { id: string; text: string };

const parseAnswer = (arg: string, login: string): Answer | undefined => {
  const match = /^(D\d+)=(?:([A-Za-z])|other:\s*(\S.*))$/i.exec(arg);

  if (!match) {
    return undefined;
  }

  const [, id, letter, other] = match;

  return {
    id: id.toUpperCase(),
    text: letter
      ? `**Answer: ${letter.toUpperCase()}** (@${login})`
      : `**Answer: Other:** ${other.trim()} (@${login})`,
  };
};

// Each decision runs from its `**D<n> · …**` line to the next one or section.
const findBlocks = (lines: string[]) => {
  const start = lines.findIndex(line => line === '## Decisions');
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith('## ')
  );
  const stop = start < 0 ? 0 : end < 0 ? lines.length : end;
  const heads = lines
    .map((line, index) => ({ id: /^\*\*(D\d+) · /.exec(line)?.[1], index }))
    .filter(({ id, index }) => id !== undefined && index > start)
    .filter(({ index }) => index < stop);

  return heads.map(({ id, index }, i) => ({
    end: heads[i + 1]?.index ?? stop,
    id: id as string,
    start: index,
  }));
};

const record = (lines: string[], answers: Answer[]): string[] => {
  const result = [...lines];

  // Last block first, so earlier line numbers stay valid.
  for (const block of findBlocks(lines).reverse()) {
    const answer = answers.find(({ id }) => id === block.id);

    if (!answer) {
      continue;
    }

    const body = result.slice(block.start, block.end);
    const target = body.findIndex(
      line => line.startsWith('**Answer') || line.startsWith('Recommended:')
    );
    const kept = body.filter(
      (line, i) =>
        i === target ||
        !(line.startsWith('**Answer') || line.startsWith('Recommended:'))
    );

    if (target >= 0) {
      kept[kept.indexOf(body[target])] = answer.text;
    } else {
      const last = kept.findLastIndex(line => line.trim() !== '');

      kept.splice(last + 1, 0, '', answer.text);
    }

    result.splice(block.start, block.end - block.start, ...kept);
  }

  return result;
};

export const run = (root: string, args: string[]): number => {
  const [file, rawLogin, ...rest] = args;
  const login = rawLogin?.replace(/^@/, '');

  if (!file || !login || !LOGIN.test(login)) {
    console.error(
      'Usage: plan-approve <plan file> <reviewer login> [D<n>=<letter> | "D<n>=other: <text>"]...'
    );

    return 1;
  }

  const path = resolve(root, file);
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  const blocks = findBlocks(lines);
  const answers = rest.map(arg => ({ answer: parseAnswer(arg, login), arg }));
  const errors = answers.flatMap(({ answer, arg }) => {
    if (!answer) {
      return [`${arg}: not D<n>=<letter> or D<n>=other: <text>`];
    }

    const block = blocks.find(({ id }) => id === answer.id);

    if (!block) {
      return [`${answer.id}: no such decision in ${file}`];
    }

    const letter = /^\*\*Answer: ([A-Z])\*\*/.exec(answer.text)?.[1];
    const options = lines
      .slice(block.start, block.end)
      .map(line => /^- \*\*([A-Z])\.\*\*/.exec(line)?.[1]);

    return letter && !options.includes(letter)
      ? [`${answer.id}: ${letter} is not an option`]
      : [];
  });

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));

    return 1;
  }

  const recorded = record(
    lines,
    answers.map(({ answer }) => answer as Answer)
  );
  const open = findBlocks(recorded)
    .filter(
      ({ end, start }) =>
        !recorded.slice(start, end).some(line => line.startsWith('**Answer'))
    )
    .map(({ id }) => id);
  const status = open.length === 0 ? 'approved' : undefined;
  const output = recorded
    .map(line =>
      status ? line.replace(/^(- \*\*Status:\*\* ).*$/, `$1${status}`) : line
    )
    .join('\n');

  writeFileSync(path, output);

  if (open.length > 0) {
    console.error(`Open decisions: ${open.join(', ')}. Status stays draft.`);

    return 1;
  }

  return 0;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(process.cwd(), process.argv.slice(2));
}
