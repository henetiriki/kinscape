# What to look for

Each finding below is a defect, not style ([Findings](review.md#findings)).

## Rules

Check the diff against `docs/security.md` and the Data rules in `AGENTS.md`, quoting the rule broken. In the checkout those two files are `main`'s; the PR's changes to them are in the diff.

Flag a test change `plans/README.md` rule 10 doesn't allow (never suggest `## Deviations` alone as the fix), and a new `v8 ignore` with no reason (`AGENTS.md` Commands).

When the diff moves or adds code in a new top-level folder, check that the guards and configs listing folders (`ROOTS`, globs, ignore lists) include it.

Flag a rule or fact the diff adds to a `.md` file that another doc or prompt already says. Name the file that should own it, and link to that file from the other (`AGENTS.md` Writing).

## Code smells (not style)

Name the refactoring with each: Extract Module, Move Function, Replace Primitive with Object, Remove Dead Code.

- Flag logic duplicated across files: two implementations of one port, a helper copied into another script.
- Flag a function over about 60 lines, or one that does more than one phase.
- Flag a type or constant defined again: `git grep` its name.
- Flag a list of primitives where a domain type exists (`Day`, branded ids, `lib/domain/validity/`).
- Flag an export, component or file that no route or test reaches.
- Flag a `process.env` read outside `server/env.mts`.

## Placement

- Check each new file against `docs/architecture.md` › _Where does X go_ and its layer table: a domain type under `lib/ui` or a clock read in `lib/domain` is misplaced.
- Check the Patterns rows enforced by "Review": variants as data attributes, slots, state in the shell, traceability.
- Flag a synonym for a _Key concepts_ term in code, UI or docs (`User` for Account, `Marker` for Pin, `Region` for Polity).

## Pattern table

- A PR that adds a pattern, rule or guard, or calls a rule "enforced", names the test or lint rule that fails when it breaks. "Review" is only for rules no test can express.
- A new top-level folder or script appears in the Patterns table's file column where it belongs.

## New surface

- A new page, route handler or server action: reached through the gate and `openTree` with a Viewer, validates its input, sets `Cache-Control: private, no-store` on Tree data, and takes no Tree or Account id from the client.
- A new environment variable, secret or service: in `server/env.mts`, a row in `docs/repo-settings.md`, and a **Blocking** decision in the Spec or plan.
- A new dependency or asset: licence and origin recorded (NFR-08, `data/sources.json` or a file beside it); a pinned version gives its reason.

## Test quality

- Flag a test that cannot fail: `toBeTruthy()` on a `getBy*` result, `toBeDefined()` where the value is known.
- Flag a test file that no `include` pattern in `vitest.config.mts` matches.
- Flag a behaviour tested only on the memory adapter when a database adapter exists.
- Flag a hand-rolled fake where an existing fake covers it.
- Flag a shipped behaviour whose test has no requirement tag (`// MAP-03`).

## Decision reversal

Search `plans/` and the Spec for each concept the diff removes or changes. If an earlier plan or Spec decided it, the plan's `## Decisions` says so and links that decision. Report a silent reversal as a plan departure.

## Stale facts

When the diff changes behaviour a doc describes (a setting, a default, a path, who may approve), flag the sentence now wrong and name the file that owns it.

## Scale

On a request path, ask what the number is at M4 scale (about 1,640 Boundary versions, 10,000 Pins). Flag:

- reference data parsed or loaded per request without a memo;
- a nested or pairwise loop over Boundary versions or Pins;
- a response that grows with the Tree with no pagination or cap.

## Workflows

- Each action and reusable workflow pinned to a full commit SHA, this repo's own included (`actions-pin-update.yml` moves those pins).
- The fewest `permissions:`; `id-token: write` only where OIDC is used.
- `${{ github.event.* }}` text passed through `env:`.
- API calls that can fail (404, rate limit) are caught, and one failure can't abort a loop over many items.
- No prompt, settings, marketplace or rule file read from the PR head.
- Comments and reviews read with an author-association filter.
- A new required check names its app.
