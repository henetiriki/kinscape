# Plan: C612: openTree returns a Tree repository for a Viewer

- **Spec:** #612
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

`lib/domain/trees` regains `Viewer` (`{ accountId }`: an Account; publishing adds anyone). `openTree(deps, token, treeId?)` stays the one entry: it resolves the session to a Viewer itself (#553 D2), opens the Account's Tree when no id is given, and returns `{ tree, viewer }`; entity Specs add a group each (`repo.persons`), built there over the store. `deps` is `{ now?, sessions, store }`, as `appAdapters()` gives. `treeView(viewer, row)` in `views.mts` is the `ToView` seam every read passes: NFR-10 acts there later. `treeAction(schema, body)` reads the cookie itself and returns `Result<R, E | 'invalid' | 'not-found'>`. The `openTree` cases join the contract suite, on memory and PGlite.

## Decisions

**D1 · What the repository exposes** · Decides: Tech lead

- **A.** The Viewer, the Tree and, later, entity groups; the store stays inside.
- ~~**B.** Also the store (D11's "db").~~

**Answer: A**.

**D2 · Which Tree `treeAction` opens** · Decides: Tech lead

- **A.** The Account's Tree (`findTrees`); `treeId` serves a URL-named Tree later.
- ~~**B.** A route's Tree id.~~

**Answer: A**.

## Files that change

| File                                                   | What                                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| `lib/domain/trees/types.ts`, `server/trees/types.ts`   | `Viewer`; `TreeRepository`, `TreeDeps`, `ToView` |
| `server/trees/repository.mts`, `views.mts` (new)       | New signature, the Viewer, the Account's Tree    |
| `server/action.mts`, `server/__tests__/action.test.ts` | Cookie, adapters, open error type (rule 10)      |
| `server/trees/__tests__/contract.ts`                   | `openTree` cases; `repository.test.ts` moves in  |
| `docs/architecture.md`, `docs/architecture-target.md`  | _Tree data_ row; item 6 moves                    |

## Order of work

Failing tests; types, `openTree`, `views.mts`, `treeAction`; docs.

## Risks

- `docs/architecture.md` is at budget: other rows shrink.
- Several Trees on one Account: the lowest id opens; v1 makes one.
- The sandbox runs neither e2e nor coverage; the tech lead runs e2e.

## Proof

| Acceptance check                                   | Proven by                                        |
| -------------------------------------------------- | ------------------------------------------------ |
| No caller outside `server/trees/` builds a Tree id | `grep -rn treeId app features server`            |
| `docs/architecture.md` names `openTree`            | The diff                                         |
| `treeAction` takes no token or id; `E` passes      | `action.test.ts`                                 |
| Contract on memory and PGlite                      | `memory-store.test.ts`, `database-store.test.ts` |
