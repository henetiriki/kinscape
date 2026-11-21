# Plan: C1117: /refine bug <n> follows the shared edit rule, and a fix review never returns a PR to draft

- **Spec:** #1117
- **Status:** approved

## Approach

`bug.md` edits a filed Bug with the steps of "Editing a filed issue" in `filing.md`. Only the Bug-only rules stay in `bug.md`:

1. "Before the first question", step 1: add the closed-Bug stop at the end of the step (D4). The text: "If the Bug is closed, stop. Edit nothing. Say that a change to merged work needs a new Bug, with a "relates to" link to this one as its cause." No step number changes, so `## New Bug` step 1 stays true.
2. Hand-over keeps "A Bug is already filed, so give no form link." It then links to [Editing a filed issue](filing.md#editing-a-filed-issue), from Read step 3 (D4). The section intro, with the rule for a failed `gh` read, then applies too.
3. Two bullets follow the link:
   - The "exact body up to the marker" paragraph. It replaces filing step 5 in Write step 3 (D2, D3).
   - The `gh` fallback. It replaces Write step 4.
4. Hand-over loses three paragraphs: the links question (Write step 1 asks it), the "Edit #<number> now?" paragraph, and the status-label paragraph (D5). "Stop there." stays as the last line.

`filing.md` Read step 2 says "a new issue of the same type" (D1).

The fix-review skills never change the draft state:

- `.github/agent/fix-review.md`: delete step 8. Line 21 ends at "labels or reviewers." Step 7 ends at "Do not ask for a review."
- `.claude/skills/fix-review-local/SKILL.md`: the big-departure override ends at the `big-departures rule` link.

## Decisions

D1 to D5 are on #1117. The build rewords the issue as the answers say ([reword step](../../.github/agent/build.md#reword)).

#1117 reverses the C1111 step that runs `gh pr ready <n> --undo` after a "Big:" line ([C1111](C1111-big-departure-draft.md)). The tech lead sets the draft state.

**D1 · Closed-Bug message** · Decides: Tech lead

**Answer: A** (@henetiriki). Read step 2 in `filing.md` says "a new issue of the same type". Only `bug.md` holds the Bug sentence with the "relates to" link.

**D2 · Body rule for a filed Bug** · Decides: Tech lead

**Answer: A** (@henetiriki). `bug.md` keeps the "exact body up to the marker" paragraph, and it replaces filing step 5 for a Bug. Only `filing.md` asks the links question.

**D3 · The Write step that the marker paragraph replaces** · Decides: Tech lead

**Answer: A** (@henetiriki). Item 2 reads "replaces filing step 5 in Write step 3". Write step 3 still writes the file and runs `gh issue edit`.

**D4 · When a closed Bug stops** · Decides: Tech lead

**Answer: A** (@henetiriki). The closed-Bug sentence goes in step 1 of "Before the first question". Hand-over links to Read steps 3 and 4 and to Write.

**D5 · The status-label paragraph of Hand-over** · Decides: Tech lead

**Answer: A** (@henetiriki). Delete the paragraph and keep "Stop there." Write step 6 of `filing.md` gives the label rule.

**D6 · The budget of each file that changes** · Decides: Tech lead

"Set the budget of each file that changes" does not say what to do for a file under the 650-word `.claude/skills/` wildcard. `bug.md` and `fix-review-local/SKILL.md` are under it. `filing.md` (1030) and `fix-review.md` (599) have their own entries. What does the build set?

- **A.** Set each own entry to the new count, rounded up to the next 10. Keep the wildcard for `bug.md` and `fix-review-local/SKILL.md`, because both get shorter. Cost: two entries and one test row.
- **B.** Do A, and add an entry for `bug.md` and `fix-review-local/SKILL.md` at the new count, rounded up to the next 10. Cost: two more entries and two test rows. Each later edit to those files then needs a budget change.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                                                                                                                         |
| -------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/refine/bug.md`               | changed       | Step 1 of "Before the first question" and Hand-over, as the Approach says.                                                                                                   |
| `.claude/skills/refine/filing.md`            | changed       | Read step 2 only.                                                                                                                                                            |
| `.github/agent/fix-review.md`                | changed       | Line 21, step 7 and step 8, as the Approach says.                                                                                                                            |
| `.claude/skills/fix-review-local/SKILL.md`   | changed       | The big-departure override, as the Approach says.                                                                                                                            |
| `scripts/word-count.mts`                     | changed       | The `fix-review.md` entry (D6), and the `plans/README.md` entry (Big: line).                                                                                                 |
| `scripts/__tests__/word-count.test.ts`       | changed       | Line 70 expects the new `fix-review.md` budget. Two rows expect the new `plans/README.md` budget.                                                                            |
| `plans/README.md`                            | changed       | The big-departures rule: a build keeps the PR a draft, and a fix review leaves the draft state to the tech lead (Big: line).                                                 |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | Lines 1874 to 1880 and 1894 to 1896 expect step 8. They expect no `gh pr ready` in `fix-review.md` and no "except in step 8". The fix-review-local test expects no `--undo`. |

`scripts/doc-links.mts` does not change. `bug.md` already links to `filing.md`, and `filing.md` gets no link to `bug.md`.

## Order of work

1. Change the two `load-agent-files.test.ts` tests and the fix-review-local test. See them fail on the `--undo` text.
2. Edit `fix-review.md` and `fix-review-local/SKILL.md`. See the tests pass.
3. Edit `filing.md` Read step 2.
4. Edit `bug.md`.
5. Set the budgets in `word-count.mts` and its test (D6).
6. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- No unit test runs a skill. Review proves each `/refine bug` check, as for C1114 and C1115.

## Proof

| Acceptance check                                                                          | Proven by                                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A closed Bug: edit nothing, and name a new Bug with a "relates to" link                   | Review of `bug.md` step 1                                                  |
| A closed Spec or Chore: Read step 2 names a new issue of the same type                    | Review of `filing.md` Read step 2                                          |
| A Bug with a plan file or open plan PR: name the plan and ask "Set `status: draft`?"      | Review: Hand-over links to Read steps 3 and 4 and Write step 6             |
| A blocked Bug with a plan keeps `status: blocked` and gets no offer                       | Review of Write step 6                                                     |
| An open Bug with no plan: body unchanged up to the marker, only the four sections change  | Review of the marker bullet in Hand-over                                   |
| A failed `gh` edit prints only the marker line and the four sections                      | Review of the fallback bullet in Hand-over                                 |
| `bug.md` has no "Edit #<number> now?" paragraph, no links question, and links `filing.md` | Review of the `bug.md` diff                                                |
| A "Big:" line never runs `gh pr ready <n> --undo`                                         | `load-agent-files.test.ts`: the `fix-review.md` and fix-review-local tests |
| `npm run words`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`  | The five commands                                                          |
| The skill changes GitHub only after a yes to a question of its own                        | Review: Hand-over adds no `gh` call; Write steps 2 and 6 ask               |
| `intent.md`, `spec.md`, `chore.md` and `## New Bug` do not change                         | Review: the diff has no lines in these files or in that section            |

## Out of scope

- `filing.md` line 42 names only `spec.md` and `chore.md` as links to "Editing a filed issue". The Constraint keeps `filing.md` to Read step 2, and line 3 already says that `bug.md` edits a filed Bug.
- `docs/how-we-work.md` line 40 names `/refine bug <number>`. The text stays true.

## Deviations

- Big: The build edits `plans/README.md` (lines 128 and 130) and raises its budget to 1310 in `scripts/word-count.mts` and its test. The big-departures rule said "Keep the PR a draft", which conflicts with "Never change the PR's draft state" in `fix-review.md`. The tech lead chose the edit in a local fix review.
