# Review rules

Where these rules and the review command disagree, these win.

## The plan

Find the PR's plan: a file under `plans/` changed in the PR; else the plan in the PR body (a chore with no issue); else the file under `plans/` whose `Spec:` line names the `#N` in its `Closes #N`. Read it. For each Approach item, Files-that-change row and Proof row, check that the diff does it. Report a missing or extra file, a Proof row nothing in the diff can satisfy, and a departure not listed under `## Deviations`. For each answered Decision, check that the Spec's Behaviour and Acceptance checks match it (`plans/README.md` rule 3). Cite requirement IDs (e.g. `MAP-03`) where the plan does.

## The rules

Check the diff against `docs/security.md` and the Data rules in `AGENTS.md`, quoting the rule broken.

Flag a test change `plans/README.md` rule 10 doesn't allow (never suggest `## Deviations` alone as the fix), and a new `v8 ignore` with no reason (`AGENTS.md` Commands).

When the diff moves or adds code in a new top-level folder, check that the guards and configs listing folders (`ROOTS`, globs, ignore lists) include it.

Flag a rule or fact the diff adds to a `.md` file that another doc or prompt already says (search for it). Name the owning file, and link to it from the other (`AGENTS.md` Writing).

In workflows, also check (these live only here, loaded from `main`, so a PR can't weaken them):

- each action and reusable workflow pinned to a full commit SHA, except this repo's own `.github/actions/**` and `.github/workflows/claude*.yml`, used as `henetiriki/kinscape/<path>@main`;
- the fewest `permissions:`;
- `${{ github.event.* }}` text passed through `env:`;
- API calls that can fail (404, rate limit) are caught, and one failure can't abort a loop over many items.

## Findings

- Ignore the command's "only if certain" and "don't flag what depends on inputs" filters. Report probable problems too.
- Label each finding **CONFIRMED** (you checked it in the code) or **PLAUSIBLE** (say what would confirm it).
- Post up to ten, one comment each: code defects and rule breaks first (at most eight, most severe first), then plan departures (at most two). Skip style nits and what a linter catches.
- Ignore the command's stop when Claude has already commented. Review every push, and don't repeat a comment still on the PR.
- Never post "No issues" alone. List the plan items and rules you checked.
