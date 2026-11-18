# Plan: C1015: Merge the lint, typecheck and format jobs into one quality job

- **Spec:** #1015
- **Status:** draft

## Approach

Replace the `lint`, `typecheck` and `format` jobs of `ci.yml` with one job, `quality`. The job keeps the draft `if:` of `lint`, then fetches the code, installs Node and runs `npm ci`. Its steps keep their names: "Lint the code", "Check the types" and "Check the format". The second and third steps carry `if: ${{ !cancelled() }}`. The ruleset replaces the three contexts with `quality` from app 15368. `npm run workflows:diagram` writes the workflows README again, because a person does not edit it.

This chore is a hand-back. The tech lead builds it.

## Decisions

**D1 · Old plans that name the old jobs** · Decides: Tech lead

The done check says that no file names the old jobs. Three old plans name them: `M0.2-lint-and-format.md`, `C419-typecheck-job.md` and `DM.2-design-tokens.md`. Do we edit them?

- **A.** Search outside `plans/`, and keep the old plans as history.
- **B.** Edit the three plans to name `quality`.
- **Other:** your own.

Recommended: A, because `AGENTS.md` says that other plans are history.

## Files that change

| File                               | New / changed | What                                         |
| ---------------------------------- | ------------- | -------------------------------------------- |
| `.github/workflows/ci.yml`         | Changed       | The `quality` job; the two header comments   |
| `.github/workflows/README.md`      | Changed       | `npm run workflows:diagram` output           |
| `scripts/github/ruleset-main.json` | Changed       | `quality` replaces three contexts            |
| `docs/building.md`                 | Changed       | Step 3: "A draft runs only the words check." |

## Order of work

1. Change `ci.yml`. Run `npm run workflows:diagram`.
2. Change the ruleset and `docs/building.md`.
3. Search the repo for "lint job", "typecheck job", "format job" and the context names. Use the scope of D1.
4. Push one commit that breaks lint, types and format. Link the red `quality` run. Revert the commit.
5. Before the merge, the tech lead runs `scripts/setup-github.sh`, then `scripts/check-github.sh`.

## Risks

- If `npm ci` fails, steps 2 and 3 also run and fail. The job is red in both cases, so the log only gets longer.
- After step 5, each open PR waits for `quality` until it merges `main`.

## Proof

| Acceptance check                        | Proven by                                          |
| --------------------------------------- | -------------------------------------------------- |
| 1. `quality` replaces the three jobs    | The diff of `ci.yml`                               |
| 2. One run shows all three failures     | The linked run of step 4                           |
| 3. A draft skips `quality`, not `words` | The CI run of the PR while it is a draft, linked   |
| 4. Ready PR and `main` push run it      | The CI run of the ready PR; the run on `main`      |
| 5. The ruleset requires `quality` only  | The ruleset diff; `scripts/check-github.sh` output |
| 6. No file names the old jobs           | The search of step 3, pasted in the PR             |
| 7. The checks pass                      | The output of each command, pasted in the PR       |

## Out of scope

- The `npm` scripts `lint`, `typecheck` and `format:check`.
- The other jobs of `ci.yml`.
