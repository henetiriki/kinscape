# Review rules

`review.md` and `review-code.md` win over the review command.

## Commands

- Run one command in each Bash call. One denied part denies the whole call.
- `npm` is off: a PR can hold a hostile script.

## The plan

Read the PR's plan (the file under `plans/` that it changes) and issue `#N` from its `Spec:` line.

Report a missing plan file, except on head branch `bot/update-action-pins` or `revert-*`.

Report each of these:

- An Approach item, a Files-that-change row or an issue request that the diff does not do.
- An extra file.
- A Proof row that nothing in the diff can satisfy.
- A departure not listed under `## Deviations`.

For each answered Decision, check that the Spec's Behaviour and Acceptance checks match it (the [plan-pr-flow rule](../../plans/README.md#plan-pr-flow)). Cite requirement IDs (`MAP-03`) where the plan does.

## Findings

- Ignore the command's "only if certain" and "don't flag what depends on inputs" filters. Report probable problems too. List the gaps that no committed file's input reaches in one `gh pr comment`, not inline.
- If a finding needs an unlikely case (see [AGENTS.md](../../AGENTS.md#workflow-rules)), start it with `Unlikely case:`. Write the three parts that the bullet names. Label it **PLAUSIBLE**. Put it in that one `gh pr comment`.
- If `.since-last-review.diff` exists (the changes since the last review), give it to the review agents, not `gh pr diff`. Flag a defect only on a line that both diffs have. Check the plan against the whole PR.
- Label each finding **CONFIRMED** (you checked the code) or **PLAUSIBLE** (say what would confirm it). Post it inline, except an unlikely case and the gaps above.
- A smell or placement finding ([`docs/code-rules.md`](../../docs/code-rules.md)) is a defect, not a nit. Label it **PLAUSIBLE** when the fix needs a design decision.
- Post at most ten findings, one comment each, in this order:
  - Code defects and rule breaks: at most eight, most severe first, with at most three smell, placement or test-quality findings.
  - Plan departures: at most two.
- Skip style nits and linter findings.
- Skip the content of `design/source/*.html` and `design/*.jpg`. The workflow [Design: Render snapshots](../../design/CANVAS.md#making-the-snapshots-and-jpgs) writes them. If a non-merge commit whose message is not `chore: export and render design snapshots` changes them, report one finding.
- If Claude commented before, ignore the command's stop and review every push. Do not repeat a finding that is still on the PR.
- Read the threads, resolved ones too, with `gh api graphql`.
- Open every review with a comment that starts `Earlier findings still open: <n>`. Count each earlier finding whose thread is resolved but whose defect is still in the code, and each finding with no line. Do not count an unresolved thread (the check does) or an unlikely case. After the first review, write "All earlier findings addressed", or link each open finding with a one-line reason. Check each finding against the current code, not only `.since-last-review.diff`. A fix, or an author's reply with an accepted reason, addresses a finding. A resolved thread alone does not.
- Never post "No issues" alone. List the plan items and rules you checked.
