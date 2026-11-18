# Plan: C1003: Split the npm Dependabot entry so that a scheduled run opens one Playwright PR

- **Spec:** #1003
- **Requirement IDs:** None: CI tooling
- **Status:** approved

## Approach

Split the npm entry of `.github/dependabot.yml` into two entries for `/`, as the Chore says. The group entry holds only `@playwright/test` in the `playwright` group. The regular entry keeps its schedule, label, held majors and six `groups`, and it ignores `@playwright/test`. A new comment tells why there are two npm entries. The Dependabot tests check each entry.

## Decisions

**Reversals of [C792](C792-playwright-group.md)** · Decided by #1003

This plan reverses two C792 choices:

- The C792 Approach says that `development` excludes `@playwright/test`. This plan removes `exclude-patterns`, because the regular entry now ignores the package.
- C792 D1 (A) moved `commit-message` off the npm entry. This plan puts the `chore` prefix back on the regular entry.

**D1 · A rejected `versioning-strategy`** · Decides: Tech lead

The Constraint wants this fix in the same PR. On #793, GitHub's `.github/dependabot.yml` check stayed queued, so the PR may get no answer before the merge.

- **A.** The build reads that check after the push. If it fails on `versioning-strategy`, the build removes the key. If it stays queued, a follow-up PR removes the key after the merge.
- **B.** The build leaves the key out of the group entry now. This changes What to change.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                           |
| -------------------------------------------- | ------------- | ---------------------------------------------- |
| `.github/dependabot.yml`                     | changed       | Two npm entries; the comment                   |
| `scripts/__tests__/playwright-image.test.ts` | changed       | The Dependabot cases check the two npm entries |

## Order of work

1. Change the Dependabot cases. See them fail.
2. Change `.github/dependabot.yml`. Push.
3. Read the `.github/dependabot.yml` check (D1).

## Risks

- GitHub can reject two entries with the same ecosystem and directory. The Constraints cover this: record it, and do not revert.

## Proof

| Acceptance check                          | Proven by                                              |
| ----------------------------------------- | ------------------------------------------------------ |
| The two npm entries                       | `playwright-image.test.ts`                             |
| No other entry and no `playwright` change | The unchanged group and docker entry cases; `git diff` |
| GitHub accepts the file                   | The check (D1); the Dependabot page                    |
| `Found 6 group(s)`, one Playwright PR     | The tech lead, from the job logs                       |
| #996 and #997 closed without a merge      | Done on 18 November                                    |

## Out of scope

- `docs/dependencies.md`: "One Dependabot PR moves `@playwright/test` and the image" stays true.
- The weekly-run result and the `1.65.1` move: the tech lead does these.
