# Code rules

Write code that follows these rules. The reviewer flags a change that breaks one. It names the refactoring that fixes it, such as Extract Function, Split Phase, Move Function or Remove Dead Code.

## Code smells (not style)

- Keep logic in one place: no copied helper, and no second implementation of one port.
- Keep a function to one phase.
- Build no stand-in for a missing component: see the [missing-components rule](../plans/README.md#missing-components).
- Define a type or constant once. Search for its name first.
- Use a domain type where one exists (`Day`, branded ids, `lib/domain/validity/`), not a list of primitives.

## Placement

- Put each new file where `docs/architecture.md` › _Where does X go_ and its layer table say (no domain type under `lib/ui`).
- Follow the pattern rows of `docs/architecture.md` and `docs/patterns/` whose _Enforced by_ is "Review".
- Follow the naming rule in `AGENTS.md` › _Source of truth_.

## Path-scoped rules

A session loads each of these files when it reads a file in its paths. Before you plan tests or a request path, read the file for it.

- [Pattern table](code-rules/pattern-table.md): `docs/architecture.md`, `docs/patterns/**`, `scripts/__tests__/**`
- [Scale](code-rules/scale.md): `server/**`, `app/data/**`, `app/**/route.ts`, `app/**/page.tsx`, `app/**/actions.ts`
- [Test quality](code-rules/test-quality.md): `**/__tests__/**`, `e2e/**`, `vitest.config.mts`, `playwright.config.ts`
