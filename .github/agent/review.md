# Review rules

`review.md` and `review-code.md` (what to look for) win over the review command.

## Commands

- Run one command in each Bash call. One denied part denies the whole call.
- `npm` is off: a PR can hold a hostile script, so run no project script.

## The plan

Read the PR's plan, the file under `plans/` that the PR changes. Read issue `#N` (`gh issue view`) from its `Spec:` line.

Report a missing plan file, except on head branch `bot/update-action-pins` or `revert-*`.

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
- Label each finding **CONFIRMED** (you checked the code) or **PLAUSIBLE** (say what would confirm it).
- A smell or placement finding ([`docs/code-rules.md`](../../docs/code-rules.md)) is a defect, not a nit. Label it **PLAUSIBLE** when the fix needs a design decision.
- Post at most ten findings, one comment each, in this order:
  - Code defects and rule breaks: at most eight, most severe first. Smell, placement and test-quality findings count here, at most three of them.
  - Plan departures: at most two.
- Skip style nits and what a linter catches.
- Skip the content of `design/source/*.html` and `design/*.jpg`. The workflow [Design: Render snapshots](../../design/CANVAS.md#making-the-snapshots-and-jpgs) writes them. If a non-merge commit whose message is not `chore: export and render design snapshots` changes them, report one finding.
- If Claude commented before, ignore the command's stop. Review every push. Do not repeat a finding that is still on the PR.
- Open every review with a comment that starts `Open findings: <n>`. Count each earlier finding that is still open. Count each finding with no line to hold it (a missing plan file). Do not count an inline finding on this commit, or an unlikely case. After the first review, write "All earlier findings addressed", or link each open finding with a one-line reason. Check each finding against the current code, not only `.since-last-review.diff`. A fix, or an author's reply with an accepted reason, addresses a finding. A resolved thread alone does not count.
- Never post "No issues" alone. List the plan items and rules you checked.
