// Prints a link that opens a GitHub issue form with every box filled in.
//
// Usage: name the form, then give each box's text after a `=== <id>` line:
//
//   node .claude/skills/refine/scripts/form-link.mjs 2-spec.yml <<'EOF'
//   === title
//   Spec: ...
//   === summary
//   ...
//   EOF
//
// Exits non-zero, with the reason, if the form doesn't exist, a box id isn't
// on the form, or the link is too long for GitHub. Then use the blocks instead.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..'
);
const forms = path.join(root, '.github', 'ISSUE_TEMPLATE');
const maxLength = 6000;

const fail = message => {
  console.error(message);
  process.exit(1);
};

const readBoxes = text => {
  const boxes = new Map();
  let key = null;

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('=== ')) {
      key = line.slice(4).trim();
      boxes.set(key, []);
    } else if (key) {
      boxes.get(key).push(line);
    }
  }

  return [...boxes]
    .map(([id, lines]) => [id, lines.join('\n').trim()])
    .filter(([, value]) => value);
};

const repository = () => {
  const url = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], {
    encoding: 'utf8',
  }).trim();
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);

  if (!match) fail(`origin is not a GitHub repository: ${url}`);

  return match[1];
};

const formName = process.argv[2];
const available = readdirSync(forms).filter(
  name => name.endsWith('.yml') && name !== 'config.yml'
);

if (
  !formName ||
  path.basename(formName) !== formName ||
  !existsSync(path.join(forms, formName))
) {
  fail(`name a form: ${available.join(', ')}`);
}
const form = path.join(forms, formName);

const ids = new Set(
  [...readFileSync(form, 'utf8').matchAll(/^\s+id:\s*(\S+)/gm)].map(
    match => match[1]
  )
);

ids.add('title');

const boxes = readBoxes(readFileSync(0, 'utf8'));
const unknown = boxes.map(([id]) => id).filter(id => !ids.has(id));

if (unknown.length)
  fail(
    `not on the form: ${unknown.join(', ')}. Form ids: ${[...ids].sort().join(', ')}`
  );

const url =
  `https://github.com/${repository()}/issues/new?template=${formName}` +
  boxes.map(([id, value]) => `&${id}=${encodeURIComponent(value)}`).join('');

if (url.length > maxLength)
  fail(`link is ${url.length} characters, over ${maxLength}`);
console.log(url);
