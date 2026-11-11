# Plan: C745: Give the design system done check one owner, and fix the refine skill conflicts

- **Spec:** #745
- **Status:** draft

## Approach

Each file gets the edit that _What to change_ names. Then a pass over each file fixes the STE breaks. The new links point at `CANVAS.md#changing-the-design-system`, because _Issue text_ and step 7 have no anchor of their own. In `COMPONENTS.md`, the line "The plan lists the boards to swap in steps 7 to 9" becomes a link to step 7. In `tools.md`, "mode" keeps only its meaning as the `publish_files` parameter. "Sharing status" replaces the `read` mode.

## Decisions

**D1 · Where the one-artifact rule stays** · Decides: Tech lead

Steps 3.2 and 3.3 and _Rules_ each say it.

- **A.** In _Rules_: "Create an artifact only in step 3.3." Steps 3.2 and 3.3 lose their copies.
- **B.** In step 3.3 only. _Rules_ loses its bullet.
- **Other:** your own.

Recommended: A, because _Rules_ holds the other run-wide limits.

## Files that change

The eleven files that _What to change_ names, and this plan.

## Risks

- `.claude/skills/**` is a hand-back path. The tech lead builds.
- The new link from `match-design/SKILL.md` to `AGENTS.md` makes no cycle: no file links `match-design/SKILL.md`.
- Removal of the `AGENTS.md` link from `chore.md` keeps the refine allowlist cycle whole.

## Proof

| Done check                             | Proven by            |
| -------------------------------------- | -------------------- |
| `npm test` passes                      | `npm test`           |
| `npm run words` passes                 | `npm run words`      |
| CANVAS holds the range; others link it | The diff             |
| "Proposed term" only in `SKILL.md`     | The `grep -rln` line |

## Out of scope

- `plans/README.md` › _Design system_ and _Missing components_. They name who runs the steps, not a done check.
