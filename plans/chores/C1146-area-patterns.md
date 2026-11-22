# Plan: C1146: Move the area patterns of docs/architecture.md to path-scoped rules

- **Spec:** #1146
- **Status:** approved

## Approach

Move each area row as it is into one of eight files in `docs/patterns/`, under the same three-column table. Each file starts with `paths:` frontmatter. `.claude/rules/<name>.md` is a symlink to it. A new module, `scripts/pattern-files.mts`, reads the files and their globs. `plan:new` and the new symlink test use it, so the two agree on what a glob matches. Globs match with `path.matchesGlob` (Node 24). Step 11 makes a `main_files` 404 an absent file, so later PRs such as #1147 can add a guarded file. Every row is a hand-back row or depends on one, so the tech lead builds it all in a local session ([hand-back rule](../README.md#hand-back)).

## Decisions

**D1 · Globs that another glob covers** · Decides: Tech lead

Step 2 asks for a glob for each path that a _Where_ cell names. Many cells name a file inside a folder that another cell of the same file names, such as `foundation/link.ts` under `app/components/`.

- **A.** Leave out a glob that another glob of the same file covers. The scoping is the same.
- **B.** Write one glob for each named path. The frontmatter and index lines grow by about 15 globs.
- **Other:** your own.

Recommended: A, because the extra globs match no other file.

Answer: A.

**D2 · The paths that an issue cites** · Decides: Tech lead

Step 5 lists each pattern file whose `paths:` match "a path that the issue cites".

- **A.** Take each code span of the body that holds a `/` or a file extension, without a `:<line>` suffix. A cited folder (ending in `/`) matches a glob under it or a glob that covers it.
- **B.** Also take path-like words outside code spans.
- **Other:** your own.

Recommended: A, because [writing rules](../../docs/writing.md) put file names in code spans, and B also matches URLs.

Answer: A.

## Globs

Each glob is a full path from the repo root.

| File             | `paths:`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.md`  | `app/components/**`, `app/Links.tsx`, `lib/ui/EventGlyph.tsx`, `features/people/components/FuzzyDateField.tsx`, `features/people/components/PersonField.tsx`, and in `features/map/components/`: `DateField.tsx`, `SearchBar.tsx`, `ZoomControls.tsx`, `LayersButton.tsx`, `AddPinButton.tsx`, `DateDock.tsx`, `Legend.tsx`, `CountMarker.tsx`, `PinFan.tsx`, `Panel.tsx`, `LayerGroup.tsx`, `FilterFields.tsx`, `SourcesDialog.tsx`, `Credits.tsx` |
| `map.md`         | `app/@map/**`, `app/MapHost.tsx`, `features/map/components/MapShell.tsx`, `app/components/foundation/usePhone.ts`, `features/map/filter.ts`, `features/map/style.ts`, `features/map/components/MapView.tsx`, `features/map/types.ts`, `features/map/layers/**`                                                                                                                                                                                      |
| `domain.md`      | `lib/domain/**`, `features/map/components/MapView.tsx`, `features/map/filter.ts`, `server/boundaries/load.mts`                                                                                                                                                                                                                                                                                                                                      |
| `data.md`        | `data/**`, `server/boundaries/app-data.ts`, `app/data/polities/route.ts`                                                                                                                                                                                                                                                                                                                                                                            |
| `tree-data.md`   | `server/trees/**`, `server/action.mts`, `server/db/TEMPLATE.sql`, `server/db/migrations/**`, `app/data/private-json.ts`, `server/adapters.mts`                                                                                                                                                                                                                                                                                                      |
| `auth.md`        | `proxy.ts`, `server/auth/current.mts`, `server/auth/sessions.mts`, `server/action.mts`, `server/adapters.mts`, `server/boundaries/app-data.ts`                                                                                                                                                                                                                                                                                                      |
| `dev-screens.md` | `app/screens/**`, `e2e/design-check.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ci-images.md`   | `docker/*/Dockerfile`                                                                                                                                                                                                                                                                                                                                                                                                                               |

`types.ts` in _Schema first_ is `lib/domain/boundaries/types.ts`, which `lib/domain/**` covers.

## Files that change

| File                                                                         | New / changed | What                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/patterns/*.md`                                                         | new           | Eight files: frontmatter, a `#` title, the table head and the rows of step 1. Only `../design/DESIGN.md#in-the-repo` changes, to `../../`.                                                                                                                                                                                     |
| `.claude/rules/*.md`                                                         | new           | Eight symlinks to `../../docs/patterns/<name>.md`.                                                                                                                                                                                                                                                                             |
| `docs/architecture.md`                                                       | changed       | Step 4: the two kept rows, then one index line per file with its link and globs. _Fitness tests_ names only `vercel-imports`.                                                                                                                                                                                                  |
| `scripts/pattern-files.mts`                                                  | new           | `patternFiles(files)`: each `docs/patterns/*.md` with its globs, parsed with `yaml`. `matches(cited, globs)` as D2 says.                                                                                                                                                                                                       |
| `scripts/__tests__/pattern-files.test.ts`                                    | new           | Done check 4: each symlink and its target, one symlink per file, each glob matches a `git ls-files` path. Unit tests of `matches`.                                                                                                                                                                                             |
| `scripts/plan-new.mts`                                                       | changed       | Takes the code spans of the body (D2). Prints `Pattern files:` and each match, or `none`.                                                                                                                                                                                                                                      |
| `scripts/__tests__/plan-new.test.ts`                                         | changed       | The two cases of done check 7. The existing output pins gain the `Pattern files:` line.                                                                                                                                                                                                                                        |
| `plans/README.md`                                                            | changed       | Step 6 sentence in _Before you draft_.                                                                                                                                                                                                                                                                                         |
| `scripts/hand-back.mts`, `scripts/__tests__/hand-back.test.ts`               | changed       | Step 7 and done check 8.                                                                                                                                                                                                                                                                                                       |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts`             | changed       | Skip a symlink (`lstatSync`). A `docs/patterns/[^/]+\.md` entry. New `docs/architecture.md` and `plans/README.md` budgets. Each budget is the count rounded up to the next 10.                                                                                                                                                 |
| `scripts/doc-links.mts`, `scripts/__tests__/doc-links.test.ts`               | changed       | `docFiles` skips a symlink, so a file counts once.                                                                                                                                                                                                                                                                             |
| `scripts/safety.mts`, `scripts/__tests__/dockerfile.ts`, `eslint.config.mjs` | changed       | Step 9 cites.                                                                                                                                                                                                                                                                                                                  |
| `docs/code-rules.md`                                                         | changed       | Step 13, lines 18 and 24.                                                                                                                                                                                                                                                                                                      |
| `.github/CODEOWNERS`                                                         | changed       | Step 12, after `docs/code-rules.md`.                                                                                                                                                                                                                                                                                           |
| `.github/actions/load-agent-files/action.yml`                                | changed       | `download` returns at once on `(HTTP 404)` in stderr and writes no file. Other failures keep three tries.                                                                                                                                                                                                                      |
| `.github/actions/run-claude/action.yml`                                      | changed       | The copy step deletes the checkout file when `agent/main/<path>` is absent. It marks only files in the index with `--skip-worktree`.                                                                                                                                                                                           |
| `.github/workflows/claude-code-review.yml`                                   | changed       | The copy step loops over its files with the same absent rule, and lists the pattern files. `main_files` lists them.                                                                                                                                                                                                            |
| `.github/workflows/claude-{build,fix-review,resolve-conflict}.yml`           | changed       | `main_files` lists the pattern files.                                                                                                                                                                                                                                                                                          |
| `scripts/__tests__/load-agent-files.test.ts`                                 | changed       | The stub writes `gh: Not Found (HTTP 404)`. The tests "fails on one that is not in the repo" and "fails when main has no copy of a file" now expect an absent file. New: a 404 is not retried; a server error still fails after three tries. `mainFiles()` and the caller tests add each `docs/patterns/` file (done check 9). |

## Order of work

Each commit passes `npm test`.

1. `word-count` and `doc-links` skip a symlink, with tests.
2. The eight pattern files, the symlinks, `docs/architecture.md`, `scripts/pattern-files.mts` and its test, the step 9 cites, `docs/code-rules.md`, `HAND_BACK` and CODEOWNERS. Check the moved rows with `git diff --word-diff`: only the link prefix differs. Set the budgets.
3. Scoping proof. Hand the tech lead three `! claude -p "<prompt>" --allowedTools Read` commands. Each prompt reads one file, then asks for the `#` title of each `.claude/rules` file in context, or "none". If a result is wrong, stop, as the #1146 Constraints say.
4. `plan:new` and the `plans/README.md` sentence, test first.
5. Step 11: the loader, the two copy steps and their tests, test first.
6. Last: the `main_files` entries and the review copy list, with the guard test.
7. Run the checks of `AGENTS.md` › _Commands_.

## Risks

- **A typo in `main_files` passes.** A 404 is now absent, not a failure. The caller tests pin each list, so a typo fails `npm test`.
- **`Review` fails on this PR.** The pinned loader on `main` fails on the new files. The tech lead merges past it (Constraint 3).
- **`path.matchesGlob` differs from Claude Code's matcher.** The globs use only `*`, `**` and literal paths, where both agree. The scoping proof checks two of them.
- **The scoping proof asks the model what it loaded.** A wrong answer is possible. Each title is unique, so a made-up title shows.

## Proof

| Acceptance check                                                  | Proven by                                 |
| ----------------------------------------------------------------- | ----------------------------------------- |
| Each file holds its rows; `docs/architecture.md` holds none       | Word diff; `pattern-files.test.ts`        |
| _Enforcement_ bullets                                             | The diff                                  |
| Frontmatter and one symlink each                                  | `pattern-files.test.ts`                   |
| The symlink test                                                  | `pattern-files.test.ts`                   |
| Scoping proof                                                     | Commands and output in the PR Evidence    |
| `plan:new` lists `tree-data.md`, or none                          | `plan-new.test.ts`                        |
| `HAND_BACK` matches both paths                                    | `hand-back.test.ts`                       |
| A pattern file missing from a `main_files` or the copy step fails | `load-agent-files.test.ts`                |
| A 404 leaves no file; another failure fails after three tries     | `load-agent-files.test.ts`                |
| CODEOWNERS rows                                                   | The diff                                  |
| `docs/code-rules.md` names `docs/patterns/` and `paths:`          | The diff                                  |
| No "architecture.md › Patterns" comment                           | `git grep` output in the PR Evidence      |
| Words and links count a pattern file once                         | `word-count.test.ts`, `doc-links.test.ts` |
| `npm test` passes                                                 | Output in the PR Evidence                 |

## Out of scope

- `design/DESIGN.md` (Constraint 7).
- The #1147 body. Check it after this PR merges.

## Deviations

- The `plans/README.md` sentence has no anchor and links to `docs/architecture.md#patterns`. `plan-rule-citations.test.ts` demands an owner cite for each anchor of that file. 4d790e66 follows 63028466.
- The copy steps of `run-claude` and the review make the folder of a file that main has and the branch lacks. `run-claude` marks only tracked files with `--skip-worktree`, because the mark fails on an untracked path. Commit 46f90674.
- The `plans/README.md` budget is 780 and the `docs/architecture.md` budget is 570. The `docs/patterns/*.md` budget is 130. Commits 63028466 and 59e1251b.
