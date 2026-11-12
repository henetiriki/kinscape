# Plan: C782: Test a Dependabot Playwright image bump without a multi-ecosystem group

- **Spec:** #782
- **Requirement IDs:** None: CI tooling
- **Status:** approved

## Approach

Move the Postgres Dockerfile to `docker/postgres/`. Add `docker/playwright/Dockerfile` with the `6e3fb7` pin. Both workflows read the image with `sed -n 's/^FROM //p' docker/playwright/Dockerfile`. A plain `docker` entry for `/docker/playwright` has no group. The tech lead builds this hand-back.

## Decisions

**D1 · The new `docker/` folder** · Decides: Tech lead

`docs/code-rules.md` lists each new top-level folder in the architecture pattern table. The Chore does not name `docs/architecture.md`.

- **A.** Add one pattern row: each CI image is the one `FROM` line of `docker/<image>/Dockerfile`. Its two tests enforce it.
- **B.** Leave `docs/architecture.md` as it is.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                              | New / changed | What                                                                |
| ----------------------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `docker/postgres/Dockerfile`                                      | moved         | From `.github/images/postgres/`                                     |
| `scripts/ci-postgres.sh`, `scripts/__tests__/ci-postgres.test.ts` | changed       | The new path                                                        |
| `docker/playwright/Dockerfile`                                    | new           | One `FROM` line                                                     |
| `.github/playwright-image`                                        | deleted       |                                                                     |
| `.github/dependabot.yml`                                          | changed       | The Postgres path; the Playwright entry                             |
| `.github/workflows/ci.yml`, `design-agent-shots.yml`              | changed       | Read the `FROM` line; the `ci.yml` comment                          |
| `scripts/__tests__/playwright-image.test.ts`                      | changed       | Pin, reader, `git grep` and Dependabot entry cases                  |
| `docs/dependencies.md`                                            | changed       | The image step; shorter Overrides and review plugin text (issue D2) |
| `docs/architecture.md`                                            | changed       | D1                                                                  |

## Order of work

1. Change the tests. See them fail.
2. Make the other changes.
3. After the merge, the tech lead runs "Check for updates" for the Playwright entry.

## Risks

- A new Playwright release makes Dependabot move the version, not only the digest. The guard test then fails until the tech lead bumps `@playwright/test` on that PR.

## Proof

| Acceptance check                                 | Proven by                           |
| ------------------------------------------------ | ----------------------------------- |
| One `FROM` line; the pin file is gone            | `playwright-image.test.ts`          |
| No other file names the image; workflows read it | `playwright-image.test.ts`          |
| `dependabot.yml` accepted; the Dependabot PR     | "Check for updates" after the merge |
| The image step, within budget                    | `npm run words`                     |
