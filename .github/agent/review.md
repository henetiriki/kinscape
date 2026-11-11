# Review rules

Where `review.md` or `review-code.md` (what to look for) disagrees with the review command, these files win.

## Commands

- Run one command in each Bash call. One denied part denies the whole call.
- `npm` is off in this review. A PR can hold a hostile script, so do not run a project script.

## The plan

Find the PR's plan: a file under `plans/` changed in the PR. Read it. Read issue `#N` (`gh issue view`) from its `Spec:` line.

If the PR has no plan file, report the missing plan file. Do not report it on head branch `bot/update-action-pins` or `revert-*`.

Report each of these:

- An Approach item, a Files-that-change row or an issue request that the diff does not do.
- An extra file.
- A Proof row that nothing in the diff can satisfy.
- A departure not listed under `## Deviations`.

For each answered Decision, check that the Spec's Behaviour and Acceptance checks match it (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)). Cite requirement IDs (for example `MAP-03`) where the plan does.

## Findings

- Ignore the command's "only if certain" and "don't flag what depends on inputs" filters. Report probable problems too. List the gaps that no committed file's input reaches in one `gh pr comment`, not inline.
- If a finding needs an unlikely case (see [AGENTS.md](../../AGENTS.md#workflow-rules)), start it with `Unlikely case:`. Write the three parts that the bullet names. Label it **PLAUSIBLE**. Put it in that one `gh pr comment`.
- If `.since-last-review.diff` exists, it holds the changes since the last review. Give it to the review agents, not `gh pr diff`. Flag a defect only on a line that both diffs have. Check the plan against the whole PR.
- Label each finding **CONFIRMED** (you checked it in the code) or **PLAUSIBLE** (say what would confirm it).
- A smell or placement finding ([`docs/code-rules.md`](../../docs/code-rules.md)) is a defect, not a nit. Label it **PLAUSIBLE** when the fix needs a design decision.
- Post at most ten findings, one comment each. Post them in this order:
  - Code defects and rule breaks: at most eight, most severe first. Smell, placement and test-quality findings count here, at most three of them.
  - Plan departures: at most two.
- Skip style nits and what a linter catches.
- If Claude commented before, ignore the command's stop. Review every push. Do not repeat a finding that is still on the PR as a new comment.
- After the first review, open with one comment. Write "All earlier findings addressed", or link each open finding with a one-line reason. Check each finding against the current code, not only `.since-last-review.diff`. A finding is addressed if the code fixes it, or if the author's reply gives a reason that you accept. A resolved thread alone does not address it.
- Never post "No issues" alone. List the plan items and rules you checked.
