# Plan: C761: Let Dependabot bump the Playwright and Postgres CI images

- **Spec:** #761
- **Status:** approved

## Approach

Move each pin to a one-line Dockerfile in `.github/images/<name>/`. `ci.yml`, `design-agent-shots.yml` and `scripts/ci-postgres.sh` read it with `sed -n 's/^FROM //p'`. In `dependabot.yml`, a `playwright` multi-ecosystem group takes `@playwright/test` from the npm entry (`patterns`) and a Docker entry for the Playwright folder. A second Docker entry, for the Postgres folder, ignores semver-major.

## Decisions

**D1 · `@playwright/test` and the `development` group** · Decides: Tech lead

The Chore keeps the package out of `development`, but forbids changes to the other groups.

- **A.** Add `exclude-patterns: ['@playwright/test']` to `development`. A test checks it.
- **B.** Change no group. If the `development` PR holds the package, stop and report.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · `commit-message` on the npm entry** · Decides: Tech lead

Dependabot allows `commit-message` on a group only.

- **A.** Move it to the group. After the merge, check the other npm groups.
- **B.** Stop and re-plan.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | New / changed | What                                      |
| ---------------------------------------------------------------- | ------------- | ----------------------------------------- |
| `.github/images/{playwright,postgres}/Dockerfile`                | new           | One `FROM` each; Postgres `17.<minor>`    |
| `.github/playwright-image`                                       | removed       |                                           |
| `ci.yml`, `design-agent-shots.yml`, `ci-postgres.sh`             | changed       | Read the `FROM` line; comments            |
| `.github/dependabot.yml`                                         | changed       | Group, Docker entries, D1, D2             |
| `scripts/__tests__/playwright-image.test.ts`                     | changed       | Dockerfile, Postgres and Dependabot cases |
| `scripts/__tests__/ci-postgres.test.ts`                          | changed       | The pin case moves out                    |
| `docs/dependencies.md`                                           | changed       | Docker, Postgres hold, design-shots step  |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | changed       | `dependencies.md` budget: 300             |

## Order of work

1. Change the tests. See them fail.
2. Pin the newest `17.<minor>` tag and its index digest.
3. Make the other changes.
4. After the merge, the tech lead runs "Check for updates".

## Proof

| Acceptance check                                                       | Proven by                           |
| ---------------------------------------------------------------------- | ----------------------------------- |
| Dockerfiles; no file names an image                                    | `playwright-image.test.ts`          |
| `dependabot.yml` accepted; one Playwright PR; `development` without it | "Check for updates" after the merge |
| Postgres gets no major                                                 | `ignore`; the next Postgres PR      |
| Hold row and design-shots step                                         | Review                              |

## Deviations

- D2: whether the npm entry's other groups still open PRs is unproven until "Check for updates" after the merge. If they do not, revert.
- The Postgres tag is `17.11`. Its digest equals the old `17` pin. Both come from `docker-library/repo-info`, because the sandbox cannot reach the registry.
- The "names no image" test uses `git grep` and skips `__tests__` folders, which name the image to check it.
- `docs/dependencies.md` needed 293 words. Its budget in `scripts/word-count.mts` and its test move from 250 to 300.
