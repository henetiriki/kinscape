# Plan: C746: Fix STE and repeated facts in the root files and docs

- **Spec:** #746
- **Status:** draft

## Approach

Each file gets the edit that _What to change_ names. Then a pass over each file fixes the STE breaks. In `AGENTS.md`, _Commands_ lists the checks as one group, and _Verifying your work_ links that group. In `docs/how-we-work.md`, the tech lead's merge stays only in _Roles_: the opening line and the _Live_ row lose it. The **Blocking** definition gets a bold lead-in under _Decisions_, and `docs/security.md` links `how-we-work.md#decisions`. In `docs/code-rules.md`, "pattern table" is the one name, as its heading says.

## Decisions

**D1 · The Spec form's meaning of Blocking** · Decides: Tech lead

`.github/ISSUE_TEMPLATE/2-spec.yml` says a **Blocking** decision "blocks the build". `how-we-work.md` already stops the build for every open decision. The new definition stops the plan.

- **A.** Leave the form. File a Chore to align its hint.
- **B.** Change the form hint in this Chore. This adds a file outside the scope.
- **Other:** your own.

Recommended: A, because the form is outside the scope that _What to change_ gives.

## Files that change

The twelve files that _What to change_ names, and this plan.

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

- `docs/writing.md`, `docs/requirements.md` and `.github/ISSUE_TEMPLATE/`.
