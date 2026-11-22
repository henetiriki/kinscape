# Plan: C1139: Lint the component tests with eslint-plugin-testing-library

- **Spec:** #1139
- **Requirement IDs:** None: test tooling
- **Status:** approved

## Approach

A local session adds `eslint-plugin-testing-library` as a pinned devDependency ([D1](#decisions)). The CI build then adds one `eslint.config.mjs` block for `**/__tests__/**`, with the plugin's `flat/react` rules and `testing-library/prefer-implicit-assert`. The build runs `npm run lint:fix` first, then fixes each remaining hit by hand, one rule at a time. A fix changes only the query or the assert: `getBy*` alone for a presence check, `queryBy*` for an absence check, `screen` for a render result, and a role or text query for a node access. If no query can reach what the test checks, the build adds an `eslint-disable-next-line` with its reason ([D2](#decisions)). The tech lead changes the first _Test quality_ bullet of `docs/code-rules.md` in `/build-local`.

## Decisions

**D1 · When the plugin lands on the branch** · Decides: Tech lead

The approving review starts the CI build at once ([building](../../docs/building.md#specs-bugs-and-chores), step 2). The build cannot add a package (`npm install` is off). Without the plugin, the build cannot run the rules or find the hits.

- **A.** Before the approving review, the tech lead's local session adds the plugin to this branch and pushes `package.json` and `package-lock.json`. The CI build then turns on the rules and fixes each hit. Cost: one local step before approval.
- **B.** Approve first. The CI build fixes only what it can find without the plugin, such as the 88 `toBeTruthy()` asserts, and writes a "Big:" line for the package. Then the local session adds the plugin, turns on the rules and fixes the rest. Cost: most of the 700 fixes move to the local session.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · A test that checks DOM nodes on purpose** · Decides: Tech lead

Some tests check markup that no Testing Library query can reach. The Constraint "Do not change what a test checks" stops a rewrite of these:

- `scripts/__tests__/design-export.test.ts` checks the exported HTML (22 lines with node access).
- `lib/design/__tests__/react-18.test.tsx` checks the React 18 pages and calls `cleanup()` (13 lines, and the one `no-manual-cleanup` hit).
- `lib/domain/relationships/__tests__/groups.test.ts` reads `groups.children`, a domain field. The plugin can report it as node access.

The options:

- **A.** Put one `eslint-disable-next-line` with a reason on each hit that no query can fix. The PR lists each one, as the done check says. Cost: about 40 disable lines.
- **B.** In `eslint.config.mjs`, turn the reported rules off for these named files, with a comment that gives the reason. Cost: fewer lines; the done check on `eslint-disable-next-line` does not cover these files, so the build writes a "Big:" line.
- **C.** Turn the plugin on only for `**/__tests__/**/*.tsx`. Cost: `design-export.test.ts` and `groups.test.ts` stay outside the rules; this changes step 2 of "What to change" and the first done check.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- `prefer-explicit-assert` with `@testing-library/jest-dom`: it adds a second package and keeps the `expect` wrappers. The issue names `prefer-implicit-assert`.
- One PR per rule: the tech lead waives the line cap, and one config block gives one lint gate.

## Files that change

| File                                                                                                                                        | New / changed | What                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `package.json`                                                                                                                              | Changed       | Local session: the pinned plugin; an `overrides` entry if its peer range omits ESLint 10       |
| `package-lock.json`                                                                                                                         | Changed       | Local session: the plugin and its dependencies                                                 |
| `eslint.config.mjs`                                                                                                                         | Changed       | A block for `**/__tests__/**`: `flat/react` rules and `testing-library/prefer-implicit-assert` |
| `app/**/__tests__/*.test.tsx`, `features/**/__tests__/*.test.tsx`, `lib/**/__tests__/*.test.tsx`, `scripts/__tests__/design-export.test.ts` | Changed       | The query and assert fixes; the disables of D2                                                 |
| `docs/code-rules.md`                                                                                                                        | Changed       | Hand-back (tech lead): the first _Test quality_ bullet reads as step 4 of the issue            |
| `plans/chores/C1139-testing-library-lint.md`                                                                                                | New           | This plan                                                                                      |

## Order of work

1. Local session (tech lead), before the approving review if D1 is A:
   - Run `npm install --save-dev --save-exact eslint-plugin-testing-library`.
   - If npm reports an ESLint peer conflict, add an `overrides` entry as `eslint-plugin-jsx-a11y` has.
   - Push `package.json` and `package-lock.json` to this branch.
2. CI build: add the `eslint.config.mjs` block. Run `npm run lint` and record the count of each rule in the PR.
3. CI build: run `npm run lint:fix`. Commit.
4. CI build: fix the hits, one rule per commit, in this order:
   - `prefer-implicit-assert`;
   - `prefer-presence-queries`;
   - `prefer-screen-queries`;
   - `render-result-naming-convention`;
   - `no-unnecessary-act`;
   - `no-container`;
   - `no-node-access`;
   - `no-manual-cleanup`.
5. CI build: after each commit, run the changed test files. Then run the checks of [Verifying your work](../../AGENTS.md#verifying-your-work).
6. CI build: list each disable of D2 in the PR body, with its file, line and reason.
7. Local session (tech lead), `/build-local`: change the first _Test quality_ bullet of `docs/code-rules.md`.

## Risks

- A `no-node-access` fix can find a different node than the old selector. Each fix keeps the same assert on the node. The build runs the test file after each change, and reads the diff for a weaker assert.
- A role query can be slow in a large tree, such as `MapShell.test.tsx`. If a test file takes more than twice as long, the build uses a `ByText` or `ByLabelText` query, which `no-node-access` also accepts.
- knip reports the plugin as an unused dependency between steps 1 and 2. The PR is a draft, so the red lint between the two pushes has no cost.
- The plugin can report a `.children` read on a plain object as node access. D2 covers these hits.
- The hit counts of the issue came from a local run. The build records the real counts in step 2.

## Proof

| Acceptance check                                                  | Proven by                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `npm run lint` passes with the rules of step 2 on                 | `npm run lint` output in the PR; the `eslint.config.mjs` block  |
| Each `testing-library/` disable gives its reason on the same line | The list in the PR body; `git grep "testing-library/"` in tests |
| The diff skips or deletes no test                                 | `npm test` test count before and after, in the PR; the diff     |
| `npm test` passes                                                 | `npm test` output (100% coverage)                               |
| The first _Test quality_ bullet reads as step 4 says              | The `docs/code-rules.md` diff                                   |

## Out of scope

- `e2e/`: the issue keeps the plugin off there.
- The move of _Test quality_ to `docs/code-rules/test-quality.md`: #1147 does it after this Chore, and copies the new bullet as it is.

## Deviations

- The local session builds every row. The CI build ran before the plugin was on the branch, so it built nothing.
- The commits go by folder, not by rule. The pre-commit hook lints each staged file with `--max-warnings 0`, so a commit takes a file only with all its hits fixed.
- `npm run lint:fix` changed 12 `getBy*` reads of an attribute or a child node to `queryBy*`. The build reverts these. It reads an absent attribute with `hasAttribute(...)` and `toBe(false)`.
- The build adds 215 disables, not about 40 (D2). 35 of them check focus through `document.activeElement`, because `toHaveFocus()` needs `@testing-library/jest-dom`.
- `prefer-implicit-assert` had 87 hits, not about 280.
