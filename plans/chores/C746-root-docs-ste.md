# Plan: C746: Fix STE and repeated facts in the root files and docs

- **Spec:** #746
- **Status:** approved

## Approach

Each file gets the edit that _What to change_ names. Then a pass over each file fixes the STE breaks. In `AGENTS.md`, _Commands_ lists the checks as one group, and _Verifying your work_ links that group. In `docs/how-we-work.md`, the tech lead's merge stays only in _Roles_: the opening line and the _Live_ row lose it. The **Blocking** definition gets a bold lead-in under _Decisions_, and `docs/security.md` links `how-we-work.md#decisions`. In `docs/code-rules.md`, "pattern table" is the one name, as its heading says.

## Decisions

**D1 · The Spec form's meaning of Blocking** · Decides: Tech lead

`.github/ISSUE_TEMPLATE/2-spec.yml` says a **Blocking** decision "blocks the build". `how-we-work.md` already stops the build for every open decision. The new definition stops the plan.

- **A.** Leave the form. File a Chore to align its hint.
- **B.** Change the form hint in this Chore. This adds a file outside the scope.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

The twelve files that _What to change_ names, `.github/ISSUE_TEMPLATE/2-spec.yml` (D1) and this plan.

## Risks

- `AGENTS.md`, `CLAUDE.md`, `docs/code-rules.md` and `docs/security.md` are hand-back paths. The tech lead builds.
- `docs/how-we-work.md` must not link `docs/security.md`. That link makes a cycle that `doc-links` rejects.
- Other files link more anchors than the Constraints name, for example `AGENTS.md#verifying-your-work`. `doc-links` fails if one goes.

## Proof

| Done check                      | Proven by       |
| ------------------------------- | --------------- |
| `npm test` passes               | `npm test`      |
| `npm run words` passes          | `npm run words` |
| **Blocking** defined and linked | The diff        |

## Out of scope

- `docs/writing.md`, `docs/requirements.md` and the other forms in `.github/ISSUE_TEMPLATE/`.

## Deviations

- `docs/architecture-target.md` items 6 and 7 lose their built parts (the contract suite and the `serverEnv` schema). `docs/architecture.md` already holds both: the _Tree data_ row and the _Where does X go_ row for `server/env.mts`.
- `docs/architecture.md` grows by no word. A **Map layer** is the panel toggle, a **style layer** is a MapLibre layer, and a **layer** alone is an architecture layer. "Map" alone is the map on screen. "Form" already has one meaning (desktop or phone layout).
- The STE pass fixes the prose and the clear table-cell breaks. A table cell that is a fragment keeps its wording.
