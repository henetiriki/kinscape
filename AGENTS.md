# Kinscape: instructions for AI agents

A map of South Africa from 1652 to today. Historical boundaries redraw as a date slider moves, and the user's ancestors are pinned where they were at the time.

This file is tool-agnostic. Agent-specific notes live in that agent's own file (e.g. `CLAUDE.md`), which imports this one.

## Source of truth

- `docs/requirements.md`: the baseline requirements. Every requirement has an ID (e.g. `MAP-03`). Cite IDs in plans, commits and PRs.
- **Issues** hold the work in progress: `type: intent` (PO-owned) → `type: spec` (agent-drafted, PO-approved).
- `plans/<milestone>.md`: the implementation plan, committed in the same PR as the code. Use `plans/TEMPLATE.md` (see *Plans* below).
- `docs/how-we-work.md`: the workflow, labels and roles. Follow it.
- Use the terms in the requirements' *Key concepts* table exactly (Person, Place, Pin, Polity, Boundary version, Jurisdiction chain, Map date, Fuzzy date) in code, UI and docs.

## Workflow rules

- Only build from a Spec labelled `status: ready-for-dev`. If something isn't covered by the spec, ask. Don't invent requirements.
- Work on a branch and open a PR using the template. Never push to `main`, never merge, never deploy to production.
- When drafting a Spec, list anything you can't resolve under **Flagged concerns** rather than choosing silently.
- Set status labels as the workflow says: `ready-for-po` when the PO must act, `in-review` when a PR is open.

## Plans

1. **Draft before code.** Plan in a read-only step using `plans/TEMPLATE.md`: the files that change, the order of work, the risks, and how each acceptance check will be proven. Don't edit files until the tech lead approves the plan.
2. **Commit the approved plan first.** Save it as `plans/<milestone>.md` with `Status: approved`, and make it the first commit on the branch, with the message `plan(<milestone>): approved by @<tech-lead>`. That commit is the approved baseline.
3. **Small departures:** if the build departs from the plan in a way that doesn't change its intent (file names, step order, an extra helper), update the plan in the same commit as the code, and add a line under `## Deviations` saying what changed and why.
4. **Big departures:** stop and return to planning if a change would alter scope, the data model, a public API, an acceptance check, or would add a dependency. The tech lead re-approves before work continues.
5. The tech lead's PR approval signs off the code and the final plan together.

## Commands

_To be filled in during M0 (install, dev, lint, test, e2e, validate boundaries)._

## Verifying your work

Run lint, tests and the boundary validator before reporting a task done, and paste the output. If a test fails, fix the code, not the test.

## Known mistakes

_Add an entry whenever the same correction is needed twice._
