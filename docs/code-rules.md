# Code rules

Write code that follows these rules. The reviewer flags a change that breaks one. It names the refactoring that fixes it, such as Extract Function, Split Phase, Move Function or Remove Dead Code.

## Code smells (not style)

- Keep logic in one place: no copied helper, and no second implementation of one port.
- Keep a function under about 60 lines and to one phase.
- Define a type or constant once. Search for its name first.
- Use a domain type where one exists (`Day`, branded ids, `lib/domain/validity/`), not a list of primitives.
- Wire each export, component or file you add to a route, page, script or workflow. Tests do not count. Skip this only if the plan names the slice that wires it.
- Read `process.env.KINSCAPE_*` only in `server/env.mts`. You may pass `process.env` to `parseEnv` or `devPagesVisible`.

## Placement

- Put each new file where `docs/architecture.md` › _Where does X go_ and its layer table say (no domain type under `lib/ui`).
- Follow the pattern table rows whose _Enforced by_ is "Review".
- Follow the naming rule in `AGENTS.md` › _Source of truth_.

## Pattern table

- When you add a pattern, rule or guard, name the test or lint rule that fails when it breaks. Do the same when you call a rule "enforced". Write "Review" only for a rule no test can express.
- List a new top-level folder or script in the pattern table's _Where_ column where it belongs.

## Test quality

- Write a test that can fail: no `toBeTruthy()` on a `getBy*` result, no `toBeDefined()` where you know the value.
- Make an `include` pattern in `vitest.config.mts` match each test file.
- When a database adapter exists, test a behaviour on it, not only on the memory adapter.
- Use an existing fake, not a hand-rolled one.
- Tag the test of each shipped behaviour with its requirement (`// MAP-03`).

## Scale

On a request path, calculate the number at M4 scale (about 1,640 Boundary versions; Pins as sized in `docs/requirements.md` NFRs). Do not:

- parse or load reference data per request without a memo;
- loop in a nested or pairwise way over Boundary versions or Pins;
- return a response that grows with the Tree with no pagination or cap.
