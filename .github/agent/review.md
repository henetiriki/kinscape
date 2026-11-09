# Review rules

Where `review.md` or `review-code.md` (what to look for) disagrees with the review command, these files win.

## The plan

Find the PR's plan: a file under `plans/` changed in the PR. Read it and issue `#N` (`gh issue view`) from its `Spec:` line. If none, report the missing plan file, except on head branch `bot/update-action-pins` or `revert-*`. Report an Approach item, Files-that-change row or issue request the diff doesn't do, an extra file, a Proof row nothing in the diff can satisfy, and a departure not listed under `## Deviations`. For each answered Decision, check that the Spec's Behaviour and Acceptance checks match it (`plans/README.md` rule 3). Cite requirement IDs (e.g. `MAP-03`) where the plan does.

## Findings

- Ignore the command's "only if certain" and "don't flag what depends on inputs" filters. Report probable problems too, but list gaps no committed file's input reaches in one `gh pr comment`, not inline.
- A finding that needs an unlikely case (see [AGENTS.md](../../AGENTS.md#workflow-rules)) states the failure, its likelihood and the cost of a fix. Label it **PLAUSIBLE** and put it in that one `gh pr comment`.
- If `.since-last-review.diff` exists (the changes since the last review), give it to the review agents instead of `gh pr diff`, and flag defects only on its lines `gh pr diff` also has. Check the plan against the whole PR.
- Label each finding **CONFIRMED** (you checked it in the code) or **PLAUSIBLE** (say what would confirm it).
- A smell or placement finding (`review-code.md`) is a defect, not a nit. Label it **PLAUSIBLE** when the fix needs a design decision.
- Post up to ten, one comment each: code defects and rule breaks first (at most eight, most severe first), smell, placement and test-quality findings among them (at most three), then plan departures (at most two). Skip style nits and what a linter catches.
- Ignore the command's stop when Claude has already commented. Review every push, and don't repeat a finding still on the PR as a new comment.
- After the first review, open with one comment: "All earlier findings addressed", or a link to each still-open finding with a one-line reason. Check each against the current code, not only `.since-last-review.diff`; one is addressed if the code fixes it or the author's reply gives a reason you accept, not by a resolved thread alone.
- Never post "No issues" alone. List the plan items and rules you checked.
