# What to look for

## Rules

Check the diff against `docs/security.md` and the Data rules in `AGENTS.md`, quoting the rule broken. In the checkout, `AGENTS.md`, `docs/security.md`, `docs/writing.md` and `docs/code-rules.md` are `main`'s; the PR's changes to them are in the diff.

Flag a test change [plans/README.md](../../plans/README.md) rule 10 doesn't allow (never suggest `## Deviations` alone as the fix), and a new `v8 ignore` with no reason (`AGENTS.md` Commands).

When the diff moves or adds code in a new top-level folder, check that the guards and configs listing folders (`ROOTS`, globs, ignore lists) include it.

Flag a rule or fact the diff adds to a `.md` file that another doc or prompt already says. Name the owner in the [docs owner table](../../docs/README.md), and link to that file from the other (`docs/writing.md`).

Check that the lines the diff adds follow `docs/writing.md`. Report all breaks in one finding that lists each line.

## Code smells (not style)

Read `docs/code-rules.md` in the checkout. Check the diff against its [Code smells](../../docs/code-rules.md#code-smells-not-style) section.

## Placement

Read `docs/code-rules.md` in the checkout. Check the diff against its [Placement](../../docs/code-rules.md#placement) section.

## Pattern table

Read `docs/code-rules.md` in the checkout. Check the diff against its [Pattern table](../../docs/code-rules.md#pattern-table) section.

## New surface

- A new page, route handler or server action: reached through the gate and `openTree` with a Viewer, validates its input, and takes no Tree or Account id from the client.
- A new environment variable, secret or service: in `server/env.mts`, with a row, and as [_New infrastructure_](../../docs/security.md#new-infrastructure) says.
- A new dependency or asset: licence and origin recorded (NFR-08, `data/sources.json` or a file beside it); a pinned version gives its reason.

## Test quality

Read `docs/code-rules.md` in the checkout. Check the diff against its [Test quality](../../docs/code-rules.md#test-quality) section.

## Decision reversal

Search `plans/` and the Spec for each concept the diff removes or changes. If an earlier plan or Spec decided it, the plan's `## Decisions` says so and links that decision. Report a silent reversal as a plan departure.

## Stale facts

When the diff changes behaviour a doc describes (a setting, a default, a path, who may approve), flag the sentence now wrong and name the file that owns it.

## Scale

Read `docs/code-rules.md` in the checkout. Check the diff against its [Scale](../../docs/code-rules.md#scale) section.

## Workflows

When the diff changes a workflow or action, check it against [Workflows](../../docs/security.md#workflows).
