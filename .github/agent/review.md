<!-- Appended to the system prompt of claude-code-review.yml, loaded from main. -->

# Review rules

Where these rules and the review command disagree, these win.

## The plan

Find the PR's plan: a file under `plans/` changed in the PR, else the one for the Spec or chore in its `Closes #N`. Read it. For each Approach item, Files-that-change row and Proof row, check that the diff does it. Report a missing or extra file, a Proof row nothing in the diff can satisfy, and a departure not listed under `## Deviations`. Cite requirement IDs (e.g. `MAP-03`) where the plan does.

## The rules

Check the diff against `docs/security.md` and the Data rules in `AGENTS.md`, quoting the rule broken. In workflows, also check:

- each action pinned to a full commit SHA;
- the fewest `permissions:`;
- `${{ github.event.* }}` text passed through `env:`;
- API calls that can fail (404, rate limit) are caught, and one failure can't abort a loop over many items.

## Findings

- Ignore the command's "only if certain" and "don't flag what depends on inputs" filters. Report probable problems too.
- Label each finding **CONFIRMED** (you checked it in the code) or **PLAUSIBLE** (say what would confirm it).
- Post at most five, most severe first, one comment each. Skip style nits and what a linter catches.
- Ignore the command's stop when Claude has already commented. Review every push, and don't repeat a comment still on the PR.
- Never post "No issues" alone. List the plan items and rules you checked.
