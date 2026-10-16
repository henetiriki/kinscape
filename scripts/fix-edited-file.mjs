import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const projectDir = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

const chunks = [];

for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const filePath = JSON.parse(Buffer.concat(chunks).toString()).tool_input
  ?.file_path;

if (!filePath) {
  process.exit(0);
}

const absolutePath = resolve(projectDir, filePath);
const relativePath = relative(projectDir, absolutePath);

if (
  relativePath.startsWith('..') ||
  relativePath === '' ||
  !existsSync(absolutePath)
) {
  process.exit(0);
}

const result = spawnSync(
  'npm',
  ['run', '--silent', 'fix:file', '--', relativePath],
  { cwd: projectDir, encoding: 'utf8' }
);

if (result.status !== 0) {
  process.stderr.write(`${result.stdout}${result.stderr}`);
  process.exit(2);
}
