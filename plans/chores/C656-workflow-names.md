# Plan: C656: Name workflows and steps in one style

- **Spec:** #656
- **Status:** approved

## Approach

A script renames each workflow, step and action `name:` that matches an old name exactly. It leaves job ids, job names and artifact names alone. Tests, a script and a doc that quote an old name change with it. `npm run workflows:diagram` rewrites the README.

## Decisions

**D1 · The verb that replaces "Check out"** · Decides: Tech lead

STE rule 10 bans phrasal verbs.

- **A.** "Fetch": "Fetch the code".
- **B.** Keep "Check out", the name of the action.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                      | What                         |
| --------------------------------------------------------- | ---------------------------- |
| `.github/workflows/*.yml`, `.github/actions/*/action.yml` | Workflow, step, action names |
| `.github/workflows/README.md`                             | Regenerated                  |
| `scripts/design-shots-ci.mts`, `design/DESIGN.md`         | Workflow name in text        |
| Six files in `scripts/__tests__/` that quote a step name  | New names (rule 10)          |

## Risks

- The paths are hand-back paths: the tech lead builds (rule 13).
- The push starts `actions-pin-update.yml`, as after any workflow change.
- The required checks use the `ci.yml` job ids. They do not change.
- `e2e` cannot start Chromium in the local sandbox. CI runs it.

## Proof

| Acceptance check                       | Proven by                                           |
| -------------------------------------- | --------------------------------------------------- |
| Workflow names match the pattern       | `grep -h '^name:'` output in Evidence               |
| Step names follow STE                  | Sorted step names in Evidence                       |
| Lint, format, words, tests, boundaries | Command output in Evidence; CI                      |
| The README needs no change             | `npm run workflows:diagram`, `git diff --exit-code` |
| Required checks unchanged              | `ruleset-main.json` and job ids have no diff        |

## Out of scope

Job ids, job names, workflow file names, and "Open or update the pin PR" (it does both).

## Deviations

- The renames came before this plan and #656. Approval covers them as built.
