// Prints a link that opens the GitHub Intent form with every box filled in.
//
// Usage, with each box's text after a `=== <id>` line:
//
//   node .claude/skills/refine/intent-link.mjs <<'EOF'
//   === title
//   Intent: ...
//   === problem
//   ...
//   EOF
//
// Exits non-zero, with the reason, if a box id isn't on the form or the link
// is too long for GitHub. Then the PO uses the blocks instead.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const form = path.join(root, ".github", "ISSUE_TEMPLATE", "1-intent.yml");
const maxLength = 6000;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function repository() {
  const url = execFileSync("git", ["-C", root, "remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) fail(`origin is not a GitHub repository: ${url}`);
  return match[1];
}

function readBoxes(text) {
  const boxes = new Map();
  let key = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("=== ")) {
      key = line.slice(4).trim();
      boxes.set(key, []);
    } else if (key) {
      boxes.get(key).push(line);
    }
  }
  return [...boxes]
    .map(([id, lines]) => [id, lines.join("\n").trim()])
    .filter(([, value]) => value);
}

const ids = new Set([...readFileSync(form, "utf8").matchAll(/^\s+id:\s*(\S+)/gm)].map((match) => match[1]));
ids.add("title");

const boxes = readBoxes(readFileSync(0, "utf8"));
const unknown = boxes.map(([id]) => id).filter((id) => !ids.has(id));
if (unknown.length) fail(`not on the form: ${unknown.join(", ")}. Form ids: ${[...ids].sort().join(", ")}`);

const url =
  `https://github.com/${repository()}/issues/new?template=${path.basename(form)}` +
  boxes.map(([id, value]) => `&${id}=${encodeURIComponent(value)}`).join("");
if (url.length > maxLength) fail(`link is ${url.length} characters, over ${maxLength}`);
console.log(url);
