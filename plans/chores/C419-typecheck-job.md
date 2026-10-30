# Plan: C419: Add a typecheck job to CI

- **Spec:** #419
- **Status:** draft

## Approach

Copy the `lint` job in `.github/workflows/ci.yml` as `typecheck`, after `lint`, running `npm run typecheck`. Add `{ "context": "typecheck" }` to `scripts/github/ruleset-main.json`. `scripts/check-github.sh` reads its expected checks from that file, so it needs no edit. Regenerate the workflows diagram, which lists each job.

## Files that change

| File                               | New / changed | What                                    |
| ---------------------------------- | ------------- | --------------------------------------- |
| `.github/workflows/ci.yml`         | Changed       | `typecheck` job, the `lint` job's shape |
| `scripts/github/ruleset-main.json` | Changed       | `typecheck` in `required_status_checks` |
| `.github/workflows/README.md`      | Changed       | `npm run workflows:diagram` output      |

## Order of work

1. The job and the diagram; `npm test` passes the diagram test.
2. The ruleset entry.
3. Mark the PR ready so the job runs. Push a commit with a type error, link the failing run, then revert it.
4. After merge, the tech lead runs `scripts/setup-github.sh`, then `scripts/check-github.sh`.

## Risks

- Applying the ruleset before `ci.yml` merges leaves every PR waiting on a check that never reports. Apply it after the merge (step 4).
- `npm run typecheck` already passes on `origin/main` (61c75f0), so the new check starts green.

## Proof

| Acceptance check                                                | Proven by                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| A type error fails `typecheck`, with the `tsc` error in its log | The reverted type-error commit's run, linked in the PR              |
| `typecheck` is required on `main`                               | `scripts/check-github.sh` output after step 4: "✅ Required checks" |

## Out of scope

- `npm run build` in `e2e` still checks types too; turning that off is a separate choice.
