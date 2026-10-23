# Plan: CH.3: Agent plans and builds a chore

- **Spec:** #181
- **Requirement IDs:** none (process change)
- **Status:** approved

## Approach

In `claude-spec-agent.yml`, the `plan` job also takes `type: chore`, and its prompt gives a Chore's id, branch and plan path and points to the hand-back. The `build` job and `claude.yml`'s exclusion also take chore plan branches; each `run-name` repeats its `if:` line for line. The chore rules (title, hand-back at plan and build) go in `plans/README.md` rule 4 only, and both prompts link to it. `docs/building.md` _Chores_ describes the quick and the filed route.

## Decisions

**D1 · Matching `chore/C<n>-` in `if:`** · Decides: Tech lead
Expression comparisons ignore case and have no regex, so `startsWith(ref, 'chore/C')` also matches a quick `chore/ci-…` branch.

- **A.** Nine prefixes, `chore/C1` … `chore/C9`, in all four expressions.
- **B.** One prefix `chore/C`; the build prompt stops if the branch isn't `^chore/C[0-9]+-`. A Build run still starts.
- **Other:** your own.

Recommended: A, because acceptance check 5 says no build starts.

**Answer: A.** Open question from the tech lead: chores started from a CLI session with no Chore issue.

**D2 · Chore plan PR title** · Decides: Tech lead
Rule 3 says `<spec-id>: <Spec title> (plan)`; the Spec says `chore: …`.

- **A.** `chore: <issue title without "Chore: "> (plan)`; the build drops `(plan)`.
- **B.** `C<n>: <title> (plan)`, as rule 3, rewording the Spec.
- **Other:** your own.

Recommended: A, because the merged commit then reads like every other chore.

**Answer: Other:** `C.<n>: <title> (plan)`, following normal spec numbering.

**D3 · Draft PR after a build hand-back** · Decides: Tech lead

- **A.** Leave it draft: comment on the PR and the issue naming the path or reason, swap the issue's label.
- **B.** Same, and close the PR.
- **Other:** your own.

Recommended: A, because the branch holds an approved plan the tech lead may build from.

## Files that change

| File                                      | New / changed | What                                                              |
| ----------------------------------------- | ------------- | ----------------------------------------------------------------- |
| `.github/workflows/claude-spec-agent.yml` | Changed       | `type: chore` in plan; chore branches in build; prompts; comments |
| `.github/workflows/claude.yml`            | Changed       | Chore plan branches in the approval exclusion                     |
| `plans/README.md`                         | Changed       | Rule 4: title, hand-back, too big                                 |
| `docs/building.md`                        | Changed       | _Chores_: both routes                                             |
| `plans/CH.3-chore-agent.md`               | New           | This plan                                                         |

## Order of work

1. Commit this plan: `plan(CH.3): approved by @henetiriki`.
2. `plans/README.md` rule 4, then `docs/building.md`, trimming nearby text (`building.md` is near 400).
3. Both workflows in one commit; diff each `run-name` against its `if:`.
4. Run lint, format check, tests, boundary validator, `npm run words` and `npm run e2e`.
5. PR body lists the post-merge proof runs.

## Risks

- **Old workflow builds this Spec:** a Spec build on a `spec/` branch, as today.
- **`workflow` scope on `KINSCAPE_BOT_PAT`:** builds of DM.3 and DM.4.1 pushed `ci.yml` changes, so it is likely present. If a chore's push is refused, the safety net comments and the tech lead adds the scope.
- **Hand-back rests on the model reading CODEOWNERS:** a missed path still needs the tech lead's review (CH.1).
- **No unit test for expressions:** proven live after merge.

## Proof

| Acceptance check                           | Proven by                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Ready chore gets a draft plan PR and link  | After merge, the Playwright pin chore set `ready-for-agent`             |
| Owner approval builds and marks ready      | Approving that draft                                                    |
| `AGENTS.md` chore handed back              | A throwaway chore naming `AGENTS.md`: no PR, comment, `ready-for-dev`   |
| Tech lead's no-issue `chore:` PR unchanged | Next such PR: Spec Agent runs read `Skipped:`                           |
| Bot draft on other branch: no build        | Review of `build` `if:`; next bot quick-chore approval reads `Skipped:` |
| Spec or Bug planned as today               | The next Spec set `ready-for-agent`                                     |
| `run-name` and `if:` agree                 | Side-by-side diff in the PR body                                        |

## Out of scope

The no-issue route, splitting a big chore, Dependabot, anyone but the tech lead starting a run, the chore form (CH.2).
