# Code rules

The reviewer flags a change that breaks one of these. Write code that follows them.

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

## Test quality

- Flag a test that cannot fail: `toBeTruthy()` on a `getBy*` result, `toBeDefined()` where the value is known.
- Flag a test file that no `include` pattern in `vitest.config.mts` matches.
- Flag a behaviour tested only on the memory adapter when a database adapter exists.
- Flag a hand-rolled fake an existing one covers.
- Flag a shipped behaviour whose test has no requirement tag (`// MAP-03`).

## Scale

On a request path, ask the number at M4 scale (about 1,640 Boundary versions; Pins as sized in `docs/requirements.md` NFRs). Flag:

- reference data parsed or loaded per request without a memo;
- a nested or pairwise loop over Boundary versions or Pins;
- a response that grows with the Tree with no pagination or cap.
