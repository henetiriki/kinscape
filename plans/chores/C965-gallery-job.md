# Plan: C965: The gallery checks run in a job of their own

- **Spec:** #965
- **Status:** approved

## Approach

Move the step "Open the gallery files" from the `design` job of `ci.yml` to a new job `gallery`. The job copies the head of `design`: the draft `if:`, `needs: image`, the container, `--user 1001`, checkout, Node and `npm ci`. It has no build cache step. Playwright writes the gallery output to `test-results/`, because `e2e/gallery.config.ts` sets no `outputDir`. An `upload-artifact` step with `if: ${{ failure() }}` uploads that folder as `gallery`. The workflows README table lists each job, so `npm run workflows:diagram` writes it again.

## Files that change

| File                                    | New / changed | What                                                      |
| --------------------------------------- | ------------- | --------------------------------------------------------- |
| `.github/workflows/ci.yml`              | Changed       | New `gallery` job; `design` loses the step; comments      |
| `.github/workflows/README.md`           | Changed       | `npm run workflows:diagram` output                        |
| `scripts/github/ruleset-main.json`      | Changed       | `gallery` context, `integration_id` 15368                 |
| `e2e/gallery.config.ts`                 | Changed       | The message names the `gallery` job                       |
| `lib/design/cards.mts`                  | Changed       | The `pinnedImage` comment names the `gallery` job         |
| `scripts/__tests__/ci-postgres.test.ts` | Changed       | Expect `gallery` in the Playwright image with no database |

## Order of work

1. Change the test so that it expects `gallery`. See it fail.
2. Add the job. Remove the step. Change the comments. Run `npm run workflows:diagram`.
3. Add the ruleset entry.
4. Search the repo outside `plans/` for "design job", "gallery" and "card image". Change each text that says `design` opens the gallery.
5. Mark the PR ready. Change one card state. Link the failed run. Remove the change.
6. After the merge, the tech lead runs `scripts/setup-github.sh`, then `scripts/check-github.sh`.

## Risks

- If the tech lead applies the ruleset before the merge, each open PR waits for `gallery`. Step 6 comes after the merge.
- If `npm ci` fails, the upload step also runs. `if-no-files-found: ignore` stops a second error.

## Proof

| Acceptance check                           | Proven by                                           |
| ------------------------------------------ | --------------------------------------------------- |
| 1. `gallery` passes; `design` has no step  | The CI run of the PR, linked                        |
| 2. A changed card fails `gallery` only     | The linked run of step 5 and its `gallery` artifact |
| 3. A draft PR skips `gallery`              | The CI run of the PR while it is a draft, linked    |
| 4. The ruleset holds `gallery`             | `scripts/github/ruleset-main.json`; `npm test`      |
| 5. `gallery` is required                   | `scripts/check-github.sh` output after step 6       |
| 6. No text says `design` opens the gallery | The search of step 4, pasted in the PR              |
| 7. The checks pass                         | The output of each command, pasted in the PR        |

## Out of scope

- `design-agent-shots.yml`, the gallery tests and `npm run design:gallery`.
