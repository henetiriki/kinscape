# Plan: C781: Restore the Postgres CI image pin for Dependabot, with an older pin

- **Spec:** #781
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** draft

## Approach

Restore the Postgres half of #770. `scripts/ci-postgres.sh` reads the `FROM` line with `sed -n 's/^FROM //p'`. The pin test accepts any `17.<minor>`, so the Dependabot PR passes CI. Review checks `17.10`.

## Decisions

**D1 · Plans in the "no other file" test** · Decides: Tech lead

`plans/M2.7-ci-postgres.md` names `postgres:17@sha256:…`. Plans are history.

- **A.** The `git grep` test skips `plans/`, as #770 did.
- **B.** The test matches only a reference with a full 64-digit digest.
- **Other:** your own.

Recommended: A, because B misses a script that names a tag without a digest.

**D2 · Word budget of `docs/dependencies.md`** · Decides: Tech lead

The new row puts the file near or over its 250-word budget.

- **A.** Raise the budget to 275.
- **B.** Shorten other text in the file.
- **Other:** your own.

Recommended: A, because #770 raised it for the same row.

## Files that change

| File                                                             | New / changed | What                                       |
| ---------------------------------------------------------------- | ------------- | ------------------------------------------ |
| `.github/images/postgres/Dockerfile`                             | new           | One `FROM` line                            |
| `scripts/ci-postgres.sh`                                         | changed       | Read the `FROM` line; comment              |
| `.github/dependabot.yml`                                         | changed       | The Postgres `docker` entry                |
| `scripts/__tests__/ci-postgres.test.ts`                          | changed       | Pin, reader, D1 and Dependabot entry cases |
| `docs/dependencies.md`                                           | changed       | The `postgres` hold row                    |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | changed       | D2                                         |

## Order of work

1. Change the tests. See them fail.
2. Make the other changes.
3. After the merge, the tech lead runs "Check for updates".

## Risks

- The sandbox cannot check the digest. A wrong digest fails the CI `test` and `e2e` jobs.

## Proof

| Acceptance check                               | Proven by                           |
| ---------------------------------------------- | ----------------------------------- |
| One `FROM` line; no other file names the image | `ci-postgres.test.ts`               |
| `test` and `e2e` pass on `17.10`               | CI on the PR                        |
| `dependabot.yml` accepted; the Dependabot PR   | "Check for updates" after the merge |
