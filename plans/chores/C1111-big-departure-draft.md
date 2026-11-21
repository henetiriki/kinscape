# Plan: C1111: Record a big departure and stay a draft, instead of stopping the build

- **Spec:** #1111
- **Status:** approved

## Approach

The [big-departures rule](../README.md#big-departures) keeps its list of five changes. Its stop sentence becomes two short rule blocks: one for scope, data model, public API and acceptance checks, and one for a dependency. Each block ends in a "Big:" line under `## Deviations` and a draft PR. One more sentence says that a "Big:" line never changes a Decisions box. The ready check, `build.md`, `fix-review.md` and the two local skills link to the rule and do not copy it.

In `fix-review.md`, line 21 keeps the words "draft state, labels or reviewers" and adds the one exception. A new last step runs `gh pr ready <n> --undo` after a successful push if the run wrote a "Big:" line. The step comes after the push, as the issue says. The C939 push-last test changes from "No step follows a successful push" to the new sentence.

The stale-facts, too-big, hand-back and design-system rules do not change, so the build still stops or hands back for each of them as it does on `main`.

## Decisions

**D1 · A test that looks wrong** · Decides: Tech lead

The [failing-tests rule](../README.md#failing-tests) calls a wrong-looking test that the plan does not list a big departure. Under the new rule, the build builds what it judges correct. Does the build change that test?

- **A.** Yes. The build changes the test, writes a "Big:" line that names it, and keeps the PR a draft. The failing-tests rule keeps its link. Cost: no new text.
- **B.** No. The failing-tests rule says: leave that test as it is, write a "Big:" line that names the test and the reason, and keep the PR a draft. Cost: one sentence in `plans/README.md`.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · A hand-back path that the plan's table does not name** · Decides: Tech lead

On `main`, `build.md` Hand-back step 2 adds the row and writes a plain `## Deviations` line. `build-local/SKILL.md` line 44 calls the same case a big departure and asks the tech lead. The issue names only `build-local/SKILL.md`.

- **A.** Both files use the new rule. Hand-back step 2 of `build.md` writes a "Big:" line. `build-local/SKILL.md` builds the path and writes a "Big:" line. Cost: one more changed line in `build.md`.
- **B.** Only `build-local/SKILL.md` changes. `build.md` keeps its plain `## Deviations` line. Cost: none, but the two files give one case two rules.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                                                                                                                                    |
| -------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans/README.md`                            | changed       | Big-departures rule: the two blocks, the equal-readings line and the Decisions sentence. Ready check: a changed done check is a "Big:" line. D1 B: the failing-tests sentence.          |
| `.github/agent/build.md`                     | changed       | Line 14: build without the package and write a "Big:" line. Step 8: a "Big:" line keeps the draft. Step 9: list each "Big:" line first. D2 A: Hand-back step 2.                         |
| `.github/agent/fix-review.md`                | changed       | Line 21: the draft-state exception. Line 22: make the fix and write a "Big:" line in the plan. Step 6: list each "Big:" line first. New step 8: `gh pr ready <n> --undo`.               |
| `.claude/skills/build-local/SKILL.md`        | changed       | Line 44: a big departure follows the rule. With a "Big:" line, the session does not run `gh pr ready <n>`.                                                                              |
| `.claude/skills/fix-review-local/SKILL.md`   | changed       | Line 27 leaves the list of questions. A new override says that a big-departure fix follows the rule, as in `fix-review.md`.                                                             |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | Line 1845: the new push-last sentence. New assertions: `build.md` and `fix-review.md` name the "Big:" line; `fix-review.md` has `gh pr ready <n> --undo` after "Push to the PR branch". |

`scripts/__tests__/plan-rule-citations.test.ts` does not change: the `big-departures` anchor stays.

## Order of work

1. Change the `load-agent-files.test.ts` assertions. See the new ones fail.
2. Edit `plans/README.md`.
3. Edit `build.md` and `fix-review.md`. Then edit the two skills.
4. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- `plans/README.md` (1200), `build.md` (600) and `fix-review.md` (450) are near their budgets, and each gains words. The build cuts words in the same file and changes no other rule. The build does not raise a budget.
- The push starts a code review before `gh pr ready <n> --undo` runs. That review runs on a PR that is then a draft. A `fix-review` label on a draft does nothing ([building](../../docs/building.md#specs-bugs-and-chores)), so no loop starts.
- An agent can build a wrong reading of the plan more often than before. The "Big:" line and the draft PR put it in front of the tech lead before the merge.

## Proof

| Acceptance check                                                                                             | Proven by                                                              |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `plans/README.md`: scope, data model, public API or acceptance-check change is built, a "Big:" line, a draft | Review of the big-departures rule                                      |
| `plans/README.md`: a missing dependency gives a draft and a "Big:" line that names the package               | Review of the big-departures rule                                      |
| `plans/README.md`: two equally correct readings give the one that changes less                               | Review of the big-departures rule                                      |
| `build.md` and `fix-review.md` have no stop for a big departure, and both name the "Big:" line               | `load-agent-files.test.ts`, new assertions; review                     |
| `fix-review.md`: the fix is made, a "Big:" line, and `gh pr ready <n> --undo`                                | `load-agent-files.test.ts`, new assertion                              |
| Each final comment lists each "Big:" line first                                                              | Review of `build.md` step 9 and `fix-review.md` step 6                 |
| The two local skills give the same rule                                                                      | Review                                                                 |
| `npm run words`, `npm test` and `npm run lint` pass                                                          | The three commands                                                     |
| A "Big:" line never changes a Decisions box                                                                  | Review of the big-departures rule                                      |
| The build still stops for a stale fact, a secret, a too-big plan and a claude.ai step                        | No edit to the stale-facts, too-big, hand-back and design-system rules |
| A build never merges, never pushes to `main` and never edits a hand-back path                                | No edit to those lines in `build.md` and `build-local/SKILL.md`        |

## Out of scope

- `docs/building.md` step 3, which says that Claude marks the PR ready. The hand-back and design-system cases already leave it a draft.

## Deviations

- The CI run denied writes to `.claude/skills/build-local/SKILL.md` and `.claude/skills/fix-review-local/SKILL.md`. A local session built those two rows.
- The "Only step 8 follows a successful push, and only after a "Big:" line" sentence in `fix-review.md` is the new push-last text. Words cut in `plans/README.md`, `build.md` and `fix-review.md` kept each rule.
