# Plan: TD.2: One fetch path for Tree data

- **Spec:** #1091
- **Requirement IDs:** [NFR-01](../docs/requirements.md#nfr-01), [NFR-03](../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

Two check functions join the "Tree data stays private" row of TD.1 in `scripts/safety.mts`. Each returns `file: rule` lines, as `memoryOnlyBreaks` does. Each reads the syntax tree, so a comment never counts. Test files do not count.

- **Fetch:** `fetchBreaks` names each non-test file under `app/` or `features/` that calls `fetch` (D2). A file in `QUERY_FILES` passes. The list starts as `['features/pins/query.ts']` (#538 plan D4).
- **Tree data URLs:** `treeUrlBreaks` names each non-test file under `app/` or `features/` with a string that starts with `/data/` (D1). A file in `QUERY_FILES` passes. A reference URL passes.

The reference URLs come from `JSON_EXEMPT` through `routeOf`: a route that sends no Tree data is the one kind a map source may name. Today that gives `/data/polities`. No second list holds it.

Each check has its own fitness test: a case for the repo, then one fixture for each acceptance check. The Patterns row in `docs/architecture.md` names TanStack Query and the two tests.

## Decisions

**D1 · Where the URL check looks** · Decides: Tech lead

The Spec names "a map source". A map source is a `sources` entry of a `Layer` (`features/map/types.ts`). `features/map/layers/polities.ts` holds the one `/data/` URL today. The Spec's aim (#678) is that Tree data reaches the browser one way.

- **A.** Each string or template literal that starts with `/data/`, in any non-test file under `app/` or `features/`. A URL in a constant, a `setData` call or a link also fails. About 20 lines.
- **B.** Only the `data`, `url` and `tiles` values in a `sources` object. A URL in a constant or a `setData` call passes. About 25 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · What counts as a call of `fetch`** · Decides: Tech lead

`features/map/components/AccountMenu.tsx` calls `router.prefetch`, which must pass.

- **A.** Each read of the name `fetch`, and the property `fetch` on `window`, `globalThis` or `self`. An alias (`const get = fetch`) and `fetch.bind` fail. A local variable named `fetch` also fails. About 15 lines.
- **B.** Only a call whose callee is `fetch`, `window.fetch`, `globalThis.fetch` or `self.fetch`. It reuses `calls()` in `scripts/safety.mts`. An alias passes. About 5 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **An ESLint `no-restricted-globals` rule for `fetch`.** It shows a break in the editor. The other safety rows are fitness tests, and the URL check still needs one.
- **A separate `REFERENCE_URLS` list.** It holds the same fact as `JSON_EXEMPT`, so the two lists can disagree.

## Files that change

| File                                  | New / changed | What                                                                                      |
| ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `scripts/safety.mts`                  | Changed       | `QUERY_FILES`, `fetchBreaks`, `treeUrlBreaks`, the header comment                         |
| `scripts/__tests__/fetch.test.ts`     | New           | The repo, a file outside the query layer, the query layer, `router.prefetch`, a test file |
| `scripts/__tests__/tree-urls.test.ts` | New           | The repo, a source with `/data/pins`, a source with `/data/polities`, the query layer     |
| `docs/architecture.md`                | Changed       | The row names TanStack Query, `features/pins/query.ts` and the two tests; "four" → "six"  |

## Order of work

1. Write the fixture cases of `fetch.test.ts`. See each fail on the rule. Then write `QUERY_FILES` and `fetchBreaks` (D2).
2. Write the fixture cases of `tree-urls.test.ts`. See each fail on the rule. Then write `treeUrlBreaks` (D1).
3. Add the repo case to each test. See each pass on `main`.
4. Change the header comment of `scripts/safety.mts` and the row and the Enforcement line of `docs/architecture.md`.
5. Run the checks in `AGENTS.md` › Commands.

## Risks

- **Server code under `app/`.** A route handler or server action that calls an outside service fails the fetch check. No file does this today. A reviewed change then adds the file to `QUERY_FILES`, or the Spec of that service changes the rule.
- **`lib/ui` is not checked.** A shared component in `lib/ui` could call `fetch`. No file does this, and it holds no feature data. Adding `lib/` to both checks costs about 2 lines. It is not built.

## Proof

| Acceptance check                                                         | Proven by                             |
| ------------------------------------------------------------------------ | ------------------------------------- |
| A file under `app/` or `features/` outside the query layer calls `fetch` | `scripts/__tests__/fetch.test.ts`     |
| A map source with `/data/pins`                                           | `scripts/__tests__/tree-urls.test.ts` |
| A map source with `/data/polities` passes                                | `scripts/__tests__/tree-urls.test.ts` |
| The query layer calls `fetch` and passes                                 | `scripts/__tests__/fetch.test.ts`     |
| The repo as it is passes each check                                      | The repo case of each test            |
| The row names TanStack Query and the checks                              | Review of `docs/architecture.md`      |

## Out of scope

How Persons load: the Person Specs and the M3 search Spec. A rule for `EventSource` or `WebSocket` (Spec Flagged concerns). Offline use (NFR-07, M6).
