# Plan: RQ.2: Viewer is a Key concept; NFR-10 reworded

- **Spec:** #616
- **Requirement IDs:** [NFR-10](../docs/requirements.md#nfr-10)
- **Status:** draft

## Approach

A docs-only edit to `docs/requirements.md`. Add a Viewer row to the Key concepts table, after Tree, reading "Whoever reads a Tree: an Account now; anyone, once a Tree is published", and delete the "Proposed term: **Viewer**" line below the table. Replace the NFR-10 text with the D1 A wording from the Spec, word for word. The M2 milestone check about a Viewer with no Account stays as it is. `npm run format` re-pads both tables.

## Files that change

| File                   | New / changed | What                                                          |
| ---------------------- | ------------- | ------------------------------------------------------------- |
| `docs/requirements.md` | changed       | Viewer row in Key concepts; "Proposed term" line gone; NFR-10 |

## Order of work

1. Add the Viewer row and delete the "Proposed term" line.
2. Replace the NFR-10 text with D1 A.
3. Run `npm run format`, then lint, `format:check`, `words`, tests, `validate:boundaries` and `e2e`.

## Risks

- Prettier re-pads every row of the requirements table when NFR-10's length changes, so the diff is larger than the edit. Review with `git diff --word-diff`.

## Proof

| Acceptance check                                   | Proven by                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Viewer is a Key concepts row; no "Proposed term"   | `git diff --word-diff`; `git grep -n "Proposed term" docs` returns nothing              |
| NFR-10 has the D1 wording; old sign-in clause gone | `git diff --word-diff`; `git grep -n "on its own" docs/requirements.md` returns nothing |
| M2 check about a Viewer with no Account unchanged  | `git diff` leaves the "Viewer with no Account" line untouched                           |
| Every CI check passes                              | CI on the PR                                                                            |

## Out of scope

`docs/architecture.md` (already names `openTree`, #614), NFR-03, NFR-09, and any code or UI.
