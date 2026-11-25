# Plan: C1236: A plan run drafts the whole plan before it reports drift

- **Spec:** #1236
- **Status:** approved

## Approach

Rewrite the "Plan run" section of `.github/agent/refresh.md` as a numbered list of the five steps that the Chore gives. The comment of refresh step 5 then waits for the draft, and the closing line comes after the Spec-check lines. [`spec-checks.md`](../../.github/agent/spec-checks.md) already lets another file put a line last. The Bug rule stays in `plans/README.md` › stale-facts. That rule points a plan run with drift to `refresh.md` › _Plan run_. A text test in `load-agent-files.test.ts` holds the new lines, as for the "Unblock run" section ([C1132](C1132-unblock-refresh-notice.md)).

The new "Plan run" section, if D1 is A:

> If the prompt says this is a plan run and there is any drift, do these steps:
>
> 1. Run `npm run plan:new`, and draft every section of the plan locally.
> 2. Draft past each drift item with its recommended option. If a later item exists only under that option, start it with "If D<k> is the recommended option".
> 3. Add each gap that the draft finds as a drift item (step 4).
> 4. Post all drift in the one comment of step 5, after the draft. End the comment with the line `Drafted the whole plan, with the recommended option of D<k> to D<m>. The run pushed nothing.`, after the Spec-check lines.
> 5. Delete the local branch and the plan file. Push nothing, and open no plan PR.
>
> For who fixes each item and which status label to set, follow the [stale-facts rule](../../plans/README.md#stale-facts). With no drift, continue with the plan.

In `plans/README.md` › stale-facts, after "If a check fails, stop.", add this sentence, with a link to `../.github/agent/refresh.md#plan-run`: "If the refresh finds drift on a plan run, first follow `refresh.md` › _Plan run_." A Bug that does not reproduce is no drift, so it still stops at once.

## Decisions

**D1 · The "open no branch" words of the Plan run section** · Decides: Tech lead

The section starts "… there is any drift: open no branch or plan PR." The Chore replaces only "After the comment, stop". Its new step 1 runs `npm run plan:new`, which makes a local branch.

- **A.** Replace the start with "… there is any drift, do these steps:". Step 5 says "Push nothing, and open no plan PR". This adds no words.
- **B.** Keep "open no branch or plan PR". A run reads a rule that its step 1 breaks.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Which gaps of the draft become drift items** · Decides: Tech lead

Step 3 of the Chore says "Add each gap that the draft finds as a drift item". Refresh step 4 defines drift: Behaviour, Acceptance checks, scope or Decisions that `main` puts in doubt. A draft also finds plan choices, such as a file name or a test place.

- **A.** Add only a gap that fits the drift of step 4. A plan choice waits for the plan PR of the next run. The PO answers only Spec items.
- **B.** Add each gap, plan choices too. The comment gets longer, and the PO sees tech-lead choices.
- **Other:** your own.

**Answer: Other:** A, with one addition. A value that Behaviour or Acceptance checks leave open is also drift, even if `main` did not cause it. Example: #1197 D9, where the Spec did not say which explicit value is step 400. File names, test places and the order of work stay plan choices for the plan PR. (@henetiriki)

## Alternatives considered

- Post the refresh comment first, and a second comment after the draft. Rejected: the Chore asks for one comment.
- Push the draft plan as a draft PR. Rejected: a Constraint forbids a push and a plan PR.

## Files that change

| File                                         | New / changed | What                                                                                                                          |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.github/agent/refresh.md`                   | Changed       | The "Plan run" section, as in _Approach_                                                                                      |
| `plans/README.md`                            | Changed       | Stale-facts: one sentence that points a plan run with drift to `refresh.md` › _Plan run_                                      |
| `scripts/word-count.mts`                     | Changed       | The `refresh.md` budget goes from 370 to the new count, rounded up to the next 10 only if 370 plus the added words allows it  |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | Two new tests in "the plan run": the section's steps in order, with the closing line last; the stale-facts stop line and link |

## Order of work

1. Write the two tests. See them fail.
2. Edit the "Plan run" section of `refresh.md`.
3. Edit the stale-facts rule of `plans/README.md`.
4. Run `npm run words`. Raise the `refresh.md` budget.
5. Run the checks in `AGENTS.md` › Commands.

## Risks

- The comment now waits for the whole draft. If a run reaches its time limit in the draft, it posts no comment, and the refresh drift is lost for that run. The safety net of `claude-run.yml` then comments and sets `status: blocked`. Likelihood: low, because a run with no drift drafts the same plan today. Fix cost: a second, early comment, which the Chore forbids. The plan builds no fix.
- A recommended option can lose. Then an item that starts "If D<k> is the recommended option" has no use. The next plan run refreshes against the answer. The Chore accepts this cost.
- `plans/README.md` is close to its budget of 790, and the Chore raises no budget for it. If the new sentence breaks the budget, the build words it shorter. If that fails, the build asks in the PR.

## Proof

| Acceptance check                                                              | Proven by                                                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A plan run with drift drafts every plan section before the comment            | New test: step 1 comes before step 4, and step 4 says "after the draft"                               |
| Draft drift and refresh drift go in one comment                               | New test: "Add each gap that the draft finds as a drift item" and "Post all drift in the one comment" |
| A run drafts past an item with the recommended option; "If D<k> is …"         | New test: both phrases                                                                                |
| The comment ends with the `Drafted the whole plan…` line; no push, no plan PR | New test: the closing line comes after "Spec-check lines", and step 5 holds "Push nothing"            |
| A plan run with no drift opens the plan PR as today                           | New test: the section still holds "With no drift, continue with the plan."                            |
| Stale-facts points a plan run to `refresh.md` › _Plan run_ with no clash      | New test: the link to `refresh.md#plan-run`; review for the clash                                     |
| `npm run words` passes; the budget grows by no more than the added words      | CI; review of the budget line                                                                         |
| A Bug that does not reproduce stops at once (Constraint)                      | New test: stale-facts keeps "If a check fails, stop.", and the new sentence names only drift          |
| The unblock run does not change (Constraint)                                  | The existing test of the "Unblock run" section; review of the diff                                    |
| No change to `.github/workflows/` or `spec-checks.md` (Constraint)            | Review of the diff; `claude-hand-back.yml` adds no `hand-back` label                                  |
| The checks in `AGENTS.md` › Commands pass                                     | CI                                                                                                    |
| The next plan run with drift posts one comment with the closing line          | Tech lead, after the merge                                                                            |

## Out of scope

- `.github/workflows/`, `.github/agent/spec-checks.md`, the "Unblock run" section and the labels.

## Deviations

- The build adds three tests, not two. The third checks that the closing line comes after the Spec-check lines.
- The build raises the `refresh.md` budget to 530, not 506. The count is 524. The tech lead chose to round up to the next 10, which the plan allowed only within the added words, so the budget is 6 words above the added count.
- Step 2 starts a dependent item "If D<k> is the recommended option", not "If D<k> is A" as #1236 says. A drift item can recommend B. The tech lead chose this wording, and #1236 is reworded to match.
