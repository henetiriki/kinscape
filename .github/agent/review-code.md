# What to look for

## Rules

Check the diff against `docs/security.md` and the Data rules in `AGENTS.md`, quoting the rule broken. In the checkout, `AGENTS.md`, `docs/security.md` and `docs/writing.md` are `main`'s; the PR's changes to them are in the diff.

Flag a test change `plans/README.md` rule 10 doesn't allow (never suggest `## Deviations` alone as the fix), and a new `v8 ignore` with no reason (`AGENTS.md` Commands).

When the diff moves or adds code in a new top-level folder, check that the guards and configs listing folders (`ROOTS`, globs, ignore lists) include it.

Flag a rule or fact the diff adds to a `.md` file that another doc or prompt already says. Name the file that should own it, and link to that file from the other (`docs/writing.md`).

Check that the lines the diff adds follow `docs/writing.md`. Report all breaks in one finding that lists each line.

## Code smells (not style)

Name the refactoring with each, e.g. Extract Function, Split Phase, Move Function, Remove Dead Code.

- Flag logic duplicated across files (a copied helper, two implementations of one port).
- Flag a function over about 60 lines or with more than one phase.
- Flag a type or constant defined again: search for its name.
- Flag a list of primitives where a domain type exists (`Day`, branded ids, `lib/domain/validity/`).
- Flag an export, component or file the diff adds that no route, page, script or workflow reaches (tests don't count), unless the plan names the slice that wires it.
- Flag a `process.env.KINSCAPE_*` read outside `server/env.mts`. Passing `process.env` to `parseEnv` or `devPagesVisible` is fine.

## Placement

- Check each new file against `docs/architecture.md` › _Where does X go_ and its layer table (a domain type under `lib/ui`).
- Check the Patterns rows whose _Enforced by_ is "Review".
- Flag a synonym for a _Key concepts_ term in code, UI or docs (`User` for Account, `Marker` for Pin, `Region` for Polity).

## Pattern table

- A PR that adds a pattern, rule or guard, or calls a rule "enforced", names the test or lint rule that fails when it breaks. "Review" is only for rules no test can express.
- A new top-level folder or script appears in the Patterns table's _Where_ column where it belongs.

## New surface

- A new page, route handler or server action: reached through the gate and `openTree` with a Viewer, validates its input, sets `Cache-Control: private, no-store` on Tree data, and takes no Tree or Account id from the client.
- A new environment variable, secret or service: in `server/env.mts`, a row in `docs/repo-settings.md`, and as `docs/security.md` › _New infrastructure_ says.
- A new dependency or asset: licence and origin recorded (NFR-08, `data/sources.json` or a file beside it); a pinned version gives its reason.

## Test quality

- Flag a test that cannot fail: `toBeTruthy()` on a `getBy*` result, `toBeDefined()` where the value is known.
- Flag a test file that no `include` pattern in `vitest.config.mts` matches.
- Flag a behaviour tested only on the memory adapter when a database adapter exists.
- Flag a hand-rolled fake an existing one covers.
- Flag a shipped behaviour whose test has no requirement tag (`// MAP-03`).

## Decision reversal

Search `plans/` and the Spec for each concept the diff removes or changes. If an earlier plan or Spec decided it, the plan's `## Decisions` says so and links that decision. Report a silent reversal as a plan departure.

## Stale facts

When the diff changes behaviour a doc describes (a setting, a default, a path, who may approve), flag the sentence now wrong and name the file that owns it.

## Scale

On a request path, ask the number at M4 scale (about 1,640 Boundary versions; Pins as sized in `docs/requirements.md` NFRs). Flag:

- reference data parsed or loaded per request without a memo;
- a nested or pairwise loop over Boundary versions or Pins;
- a response that grows with the Tree with no pagination or cap.

## Workflows

When the diff changes a workflow or action:

- Each action and reusable workflow pinned to a full commit SHA, this repo's own included (`actions-pin-update.yml` moves those pins).
- The fewest `permissions:`; `id-token: write` only where OIDC is used.
- `${{ github.event.* }}` text passed through `env:`.
- API calls that can fail (404, rate limit) are caught, and one failure can't abort a loop over many items.
- No prompt, settings, marketplace or rule file read from the PR head.
- Comments and reviews read with an author-association filter.
- A new required check names its app.
