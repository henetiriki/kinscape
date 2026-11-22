# Plan: C1147: Move the path-specific code rules to guarded path-scoped files

- **Spec:** #1147
- **Status:** approved

## Approach

Move _Test quality_, _Scale_ and _Pattern table_ of `docs/code-rules.md`, each with its `## ` heading and text as it is, into one file of `docs/code-rules/`. Each file starts with `paths:` frontmatter, in the form of `docs/patterns/*.md`. `.claude/rules/code-rules-<name>.md` is a symlink to it, in the form of the `docs/patterns/` symlinks. `docs/code-rules.md` keeps _Code smells_ and _Placement_, loses the `var(--token)` bullet and gains an index. The new files get the guards of `docs/code-rules.md`: `HAND_BACK`, CODEOWNERS, each `main_files` list and both lists of the review copy step. The tests read `docs/code-rules/` with `readdirSync`, as they read `docs/patterns/`, so a new file with no entry fails. The tech lead builds every row in one local session (D1).

## Decisions

**D1 · Who builds the CI rows** · Decides: Tech lead

Constraint 1 gives the CI agent the rows outside `HAND_BACK`: `scripts/hand-back.mts`, `review-code.md`, `word-count.mts` and the tests. Each of their tests fails until a hand-back row lands. #1146 had the same coupling.

- **A.** The tech lead builds every row in one local session. Each commit passes `npm test`.
- **B.** The tech lead commits the hand-back rows first. The CI agent builds the rest on the same PR.
- **Other:** your own.

Recommended: A, because B leaves a branch that fails `npm test` between two hand-offs.

Answer: A.

**D2 · Scale globs for pages and server actions** · Decides: Tech lead

The issue gives _Scale_ the paths `server/**`, `app/data/**` and `app/**/route.ts`. A page such as `app/people/(list)/page.tsx` and a server action such as `app/people/actions.ts` also run on each request.

- **A.** Add `app/**/page.tsx` and `app/**/actions.ts`. The dev pages in `app/screens/` also match.
- **B.** Keep the issue's globs. Write the gap under Risks.
- **Other:** your own.

Recommended: A, because the rule is about request paths.

Answer: A. The build rewords step 1 of #1147.

**D3 · How a planner gets the scoped rules** · Decides: Tech lead

`AGENTS.md` tells a planner to read `docs/code-rules.md`, which now holds only an index of the scoped files.

- **A.** Add one sentence to the index: "Before you plan tests or a request path, read the file for it."
- **B.** List `docs/code-rules/*.md` in the plan list of `AGENTS.md`. Each plan then loads all three files.
- **C.** Accept the gap.
- **Other:** your own.

Recommended: A, because it keeps the saving and costs about 15 words.

Answer: A.

The `var(--token)` bullet came from [C1096](C1096-component-css-tokens.md) (_Approach_). Step 3 of #1147 removes it, because the _Tokens are the one source_ row of `docs/architecture.md` holds the rule.

## Files that change

| File                                                                           | New / changed | What                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/code-rules/test-quality.md`, `scale.md`, `pattern-table.md`              | new           | Frontmatter with the paths of step 1, then the `## ` section as it is. No link back to `docs/code-rules.md` or `AGENTS.md`.                                                                                                                                  |
| `.claude/rules/code-rules-{test-quality,scale,pattern-table}.md`               | new           | Symlinks to `../../docs/code-rules/<name>.md`.                                                                                                                                                                                                               |
| `docs/code-rules.md`                                                           | changed       | Remove the three sections and the `var(--token)` bullet. Add `## Path-scoped rules`: one line per file, its link and its globs in code spans.                                                                                                                |
| `.github/CODEOWNERS`                                                           | changed       | `docs/code-rules/** @henetiriki` after `docs/code-rules.md`.                                                                                                                                                                                                 |
| `.github/workflows/claude-{build,fix-review,resolve-conflict,code-review}.yml` | changed       | `main_files` lists the three files after `docs/code-rules.md`, sorted. `claude-code-review.yml` also lists them in the `for f in` loop and the `git status --short --` line of the copy step.                                                                |
| `scripts/hand-back.mts`, `scripts/__tests__/hand-back.test.ts`                 | changed       | `docs/code-rules/**` after `docs/code-rules.md`. A `SAMPLES` row with `docs/code-rules/scale.md`, the list pin, and an `is a hand-back path` case.                                                                                                           |
| `.github/agent/review-code.md`                                                 | changed       | Line 3 reads the three files of `docs/code-rules/` beside `docs/code-rules.md`. Line 7 names them as main's. The three links point to `../../docs/code-rules/<name>.md#<anchor>`.                                                                            |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts`               | changed       | `{ limit: 200, pattern: /^docs\/code-rules\/[^/]+\.md$/ }` after the `docs/code-rules.md` entry, which drops to 320. Budget rows for both.                                                                                                                   |
| `scripts/__tests__/load-agent-files.test.ts`                                   | changed       | `CODE_RULE_FILES` from `readdirSync('docs/code-rules')`, sorted, after `CODE_RULES` in `mainFiles()`, the caller tests and the copy-step test. A new test pins the `git status --short --` list to the same files. Rows 187–189 read `code-rules/<name>.md`. |
| `scripts/__tests__/pattern-files.test.ts`                                      | changed       | A `docs/code-rules/` group: each file has its symlink, globs that each match a tracked file, and a line in the `docs/code-rules.md` index with its globs. "No symlink to anything else" also allows these three.                                             |

## Order of work

Each commit passes `npm test`.

1. Branch `chore/C1147-code-rules-scoped` from `origin/main` in `.claude/worktrees/`. Hand the tech lead `! npm run plan:new -- 1147 code-rules-scoped`. Commit this plan as `plan(C1147): approved by @henetiriki`.
2. Add the three files, the symlinks, the `docs/code-rules.md` edit, the `review-code.md` edit, and the test changes of `pattern-files.test.ts` and rows 187–189. Check the move with `git diff --word-diff`: only the frontmatter is new.
3. `HAND_BACK`, CODEOWNERS and the hand-back test.
4. Change the word budgets and their test. Run `npm run words`.
5. Write the `CODE_RULE_FILES` changes and the `git status` test first, and see them fail. Then change the four workflows.
6. Scoping proof. Hand the tech lead two `! claude -p "<prompt>" --allowedTools Read` commands. Each prompt reads one file, then quotes the first bullet of each `.claude/rules` file in context, or "none":
   - a file under `features/map/__tests__/`: the _Test quality_ bullet, and no _Scale_ bullet;
   - a file under `server/`: the _Scale_ bullet, and no _Test quality_ bullet.
7. Run the checks of `AGENTS.md` › _Commands_, and `doc-links.test.ts` alone.

## Risks

- **`Review` does not start on this PR.** The PR changes `claude-code-review.yml`, so it differs from main's copy. The tech lead merges past it, as for #1146.
- **The scoped text drops out of a session that never reads a matching file.** That is the point of the Chore. The index in `docs/code-rules.md` tells a planner to read the file for tests or a request path (D3).
- **`server/**` overlaps the scoping of `tree-data.md` and `auth.md`.** Both load on a `server/` read. That is fine: each holds other text.
- **The proof asks the model what it loaded.** A wrong answer is possible. The quoted bullet is unique, so a made-up quote shows.

## Proof

| Acceptance check                                                | Proven by                                  |
| --------------------------------------------------------------- | ------------------------------------------ |
| Each file holds its section; `docs/code-rules.md` does not      | Word diff; `load-agent-files.test.ts` rows |
| No `var(--token)` bullet                                        | The diff                                   |
| One symlink per new file                                        | `pattern-files.test.ts`                    |
| `HAND_BACK` matches `docs/code-rules/scale.md`                  | `hand-back.test.ts`                        |
| CODEOWNERS row                                                  | The diff                                   |
| A missing file in a `main_files` list or a copy-step list fails | `load-agent-files.test.ts`                 |
| Scoping proof                                                   | Commands and output in the PR Evidence     |
| No new link cycle                                               | `doc-links.test.ts` output                 |
| `npm run words` and `npm test` pass                             | Output in the PR Evidence                  |

## Out of scope

- `plan:new` does not list the `docs/code-rules/` files. It calls `patternFiles` with its default folder, `docs/patterns/`.
- `.github/agent/build.md` and `AGENTS.md` keep their link to `docs/code-rules.md`. The index there names the scoped files.

## Deviations

- The session wrote this plan from the approved text, not from the `plan:new` stub. The related issues (#1137, #1138, #1139, #1146) are merged.
- Steps 2 to 5 are one commit, because `load-agent-files.test.ts` and `pattern-files.test.ts` change in more than one step. Commit ea6b6b2e.
- `scripts/pattern-files.mts`: `patternFiles` takes a folder, so the code-rule tests reuse it. The review of the PR found this.
