# Kinscape

A map of South Africa from 1652 to today. Historical boundaries redraw as a date slider moves, and the user's ancestors are pinned where they were at the time.

## Source of truth

- `docs/requirements.md`: the baseline requirements. Every requirement has an ID (e.g. `MAP-03`). Cite IDs in plans, commits and PRs.
- **Issues** hold the work in progress: `type: intent` (PO-owned) → `type: spec` (Claude-drafted, PO-approved).
- `plans/<milestone>.md`: the approved implementation plan, committed in the same PR as the code.
- `docs/how-we-work.md`: the workflow, labels and roles. Follow it.
- Use the terms in the requirements' *Key concepts* table exactly (Person, Place, Pin, Polity, Boundary version, Jurisdiction chain, Map date, Fuzzy date) in code, UI and docs.

## Workflow rules for Claude

- Only build from a Spec labelled `status: ready-for-dev`. If something isn't covered by the spec, ask. Don't invent requirements.
- Start every build in plan mode. Commit the approved plan as `plans/<milestone>.md` before implementing, and update it in the same commit if implementation departs from it.
- Work on a branch and open a PR using the template. Never push to `main`, never merge, never deploy to production.
- When drafting a Spec, list anything you can't resolve under **Flagged concerns** rather than choosing silently.
- Set status labels as the workflow says: `ready-for-po` when the PO must act, `in-review` when a PR is open.

## Commands

_To be filled in during M0 (install, dev, lint, test, e2e, validate boundaries)._

## Verifying your work

Run lint, tests and the boundary validator before reporting a task done, and paste the output. If a test fails, fix the code, not the test.

## Things Claude gets wrong

_Add an entry whenever the same correction is needed twice._
