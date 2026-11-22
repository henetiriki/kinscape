# Plan: C1145: Move the build rules of plans/README.md to plans/BUILD.md

- **Spec:** #1145
- **Status:** draft

## Approach

Move the six build sections of `plans/README.md` into a new `plans/BUILD.md` without a change. Keep each section under its `##` heading on `main` (D5 of the Chore). Then change each cite of a moved anchor to name `plans/BUILD.md`. Then give the new file its own word budget, CODEOWNERS line, docs row and plan-file filter.

`scripts/__tests__/plan-rule-citations.test.ts` checks two rule files. Each rule file has a path, a `SECTIONS` list and its own cite patterns:

- a link `plans/<file>#<anchor>`;
- a plain-text cite `plans/<file>, <anchor> rule`;
- an in-file link `](#<anchor>)`, only in that file;
- a sibling link `](<file>#<anchor>)`, only in a file under `plans/`. `plans/README.md` line 57 then cites `[test-first rule](BUILD.md#test-first)`.

Each check of the test runs for each rule file: owner, headings and missing anchors. `plans/BUILD.md` goes into `IN_SCOPE`.

`AGENTS.md`, `.github/agent/spec-checks.md` and `.github/CODEOWNERS` are hand-back paths, so the plan PR gets `hand-back`. The CI agent builds the other rows. The tech lead builds the three hand-back rows in a local session.

## Files that change

| File                                              | New / changed | What                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plans/BUILD.md`                                  | new           | The title "# Build rules", the line "These rules apply to each build of an approved plan.", and the six sections under _Who builds_, _While you build_, _When the plan changes_ and _Before ready_. _Failing tests_ loses the line "The plan must list that test under Files that change." |
| `plans/README.md`                                 | changed       | Remove the six sections and the _Before ready_ heading. Line 3 reads as step 3 of the Chore. Line 57 links to `BUILD.md#test-first`.                                                                                                                                                       |
| `plans/TEMPLATE.md`                               | changed       | Under _Files that change_: `<!-- List each test whose behaviour the plan changes. -->`.                                                                                                                                                                                                    |
| `.github/agent/build.md`                          | changed       | Line 3 follows `plans/BUILD.md`. Lines 14, 16, 18, 20 and 36 link to `../../plans/BUILD.md#<anchor>`.                                                                                                                                                                                      |
| `.github/agent/fix-review.md`                     | changed       | Lines 19 and 22 link to `plans/BUILD.md`.                                                                                                                                                                                                                                                  |
| `.github/agent/resolve-conflict.md`               | changed       | Line 22 links to `plans/BUILD.md`.                                                                                                                                                                                                                                                         |
| `.github/agent/review-code.md`                    | changed       | Line 9 links to `plans/BUILD.md`.                                                                                                                                                                                                                                                          |
| `.claude/skills/build-local/SKILL.md`             | changed       | Lines 38 and 44 link to `../../../plans/BUILD.md#<anchor>`.                                                                                                                                                                                                                                |
| `.claude/skills/fix-review-local/SKILL.md`        | changed       | Line 28 links to `plans/BUILD.md`.                                                                                                                                                                                                                                                         |
| `eslint.config.mjs`                               | changed       | Lines 66 and 72 read "plans/BUILD.md, failing-tests rule".                                                                                                                                                                                                                                 |
| `.github/pull_request_template.md`                | changed       | Line 22 reads "plans/BUILD.md, test-first rule".                                                                                                                                                                                                                                           |
| `scripts/__tests__/test-modifiers-config.test.ts` | changed       | Line 5 cites `plans/BUILD.md#failing-tests`.                                                                                                                                                                                                                                               |
| `scripts/__tests__/load-agent-files.test.ts`      | changed       | Lines 1717 to 1720 pin `(../../plans/BUILD.md#ready-check)` and read `plans/BUILD.md`. Line 1925 pins the `plans/BUILD.md` link.                                                                                                                                                           |
| `scripts/__tests__/plan-rule-citations.test.ts`   | changed       | Two rule files, as the Approach says. New fixtures: a sibling link, and a cite of the wrong file.                                                                                                                                                                                          |
| `scripts/word-count.mts`                          | changed       | A `plans/BUILD.md` entry before the `plans/README.md` entry. Both budgets are the count after the move, rounded up to the next 10.                                                                                                                                                         |
| `scripts/__tests__/word-count.test.ts`            | changed       | Lines 62 and 167 pin the new `plans/README.md` budget. A `plans/BUILD.md` row after line 62, and one in the "which is not a plan" test at line 165.                                                                                                                                        |
| `scripts/agent-approve.mts`                       | changed       | Line 59: `(?!BUILD\|README\|TEMPLATE)`.                                                                                                                                                                                                                                                    |
| `scripts/__tests__/agent-approve.test.ts`         | changed       | Line 660 adds `plans/BUILD.md` to the file list.                                                                                                                                                                                                                                           |
| `docs/README.md`                                  | changed       | A "Build rules" row after line 21, with the link `[Build rules](../plans/BUILD.md)`.                                                                                                                                                                                                       |
| `AGENTS.md`                                       | changed       | Tech lead. Two read lists in _Plans_, as step 7 of the Chore says. Line 67 links to `plans/BUILD.md#failing-tests`.                                                                                                                                                                        |
| `.github/agent/spec-checks.md`                    | changed       | Tech lead. Line 12 links to `../../plans/BUILD.md#ready-check`.                                                                                                                                                                                                                            |
| `.github/CODEOWNERS`                              | changed       | Tech lead. `plans/BUILD.md @henetiriki` after line 15.                                                                                                                                                                                                                                     |

The `AGENTS.md` text of _Plans_, after "don't edit files until the tech lead approves the plan.":

> Before you draft or change a plan, read these files:
>
> - `plans/README.md`, `plans/TEMPLATE.md`, `docs/architecture.md`, `docs/code-rules.md` and your own plan.
>
> Before you build, read these files:
>
> - `plans/BUILD.md`, `docs/architecture.md`, `docs/code-rules.md` and your own plan.

The tech lead can keep one file per list line, as on `main`.

## Order of work

1. Make `plans/BUILD.md`. Then change `plans/README.md` and `plans/TEMPLATE.md`. Compare each moved section with `main` by `git diff --word-diff`: the only change is the removed plan-time line.
2. Count the words of both files with `npm run words`. Round each count up to the next 10.
3. Change `word-count.test.ts`. See it fail on the `plans/BUILD.md` budget of 1500 ([test-first rule](../BUILD.md#test-first)). Then change `word-count.mts`.
4. Change `agent-approve.test.ts`. See it fail on "has 1". Then change `agent-approve.mts`.
5. Change `plan-rule-citations.test.ts`. See it fail on the cites of moved anchors. Then change the cites of the CI rows.
6. Change `load-agent-files.test.ts`, `docs/README.md` and the three plain-text cites.
7. Run the checks of `AGENTS.md` › _Commands_.
8. The tech lead builds the three hand-back rows. Then `npm test` passes.

## Risks

- **Red tests until the hand-back commit.** Until the tech lead pushes `AGENTS.md` and `spec-checks.md`, three tests fail: `plan-rule-citations`, `doc-links` and the line 1718 pin of `load-agent-files`. The CI build names them in its hand-back comment.
- **Little room in the `plans/README.md` budget.** #1146 step 6 adds one sentence to _Before you draft_. #1146 then raises the budget.
- **`hand-back.mts` reads `plans/BUILD.md` as a plan.** Its `PLAN` pattern takes each `plans/**.md`. `plans/BUILD.md` has no _Files that change_ heading, so `tablePaths` gives no path. No change.

## Proof

| Acceptance check                                                                  | Proven by                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `plans/BUILD.md` has the title, the line and the six sections under four headings | `plan-rule-citations.test.ts` `SECTIONS` of `plans/BUILD.md`; the word diff |
| `plans/README.md` holds none of them and has no _Before ready_ heading            | `plan-rule-citations.test.ts` `SECTIONS` of `plans/README.md`               |
| Line 3 of `plans/README.md` is the text of step 3                                 | The diff                                                                    |
| The plan-time line is in `plans/TEMPLATE.md`, not in `plans/BUILD.md`             | The diff; `git grep "must list that test"` finds only old plans             |
| Each link reaches its anchor                                                      | `doc-links.test.ts`                                                         |
| Each cite reaches an anchor of the file that it names, and an owner cites each    | `plan-rule-citations.test.ts`                                               |
| No link in `plans/README.md` to a moved anchor; old plans keep theirs             | `plan-rule-citations.test.ts`; `git grep` output in the PR Evidence         |
| `AGENTS.md` holds the two read lists                                              | The tech lead's diff                                                        |
| `.github/CODEOWNERS` gives `plans/BUILD.md` to `@henetiriki`                      | The tech lead's diff                                                        |
| `docs/README.md` has the "Build rules" row                                        | `doc-links.test.ts`; the diff                                               |
| `plans/BUILD.md` has its own budget and is not counted as a plan                  | `npm run words`; `word-count.test.ts` `budgetFor` and "which is not a plan" |
| A PR with a plan file and `plans/BUILD.md` has one plan file                      | `agent-approve.test.ts` line 660                                            |
| `npm test` passes                                                                 | `npm test` output after the hand-back commit                                |

## Out of scope

- The links in old plans to `plans/README.md` (D3 of the Chore).
- The other cites of `plans/README.md` anchors that stay there.

## Deviations
