# Plan: C792: Move @playwright/test and the Playwright image in one Dependabot PR

- **Spec:** #792
- **Requirement IDs:** None: CI tooling
- **Status:** draft

## Approach

Restore the `playwright` group of #770 for `/docker/playwright`. The npm entry joins it with `patterns: ['@playwright/test']`. The Docker entry joins it with `patterns: ['*']` and takes its schedule, label and prefix from the group. `development` excludes `@playwright/test`. Both pins move to `1.64.1`.

## Decisions

**D1 · `commit-message` on the npm entry** · Decides: Tech lead

In #770, `commit-message` was group-only: a group entry cannot set it. The Chore forbids changes to other entries.

- **A.** Move it from the npm entry to the group, as #770 did. Other npm PRs can lose the `chore` prefix.
- **B.** Keep it. If GitHub rejects the file, stop for A.
- **Other:** your own.

Recommended: A, because GitHub rejected only the group PR of #770.

## Files that change

| File                                         | New / changed | What                                  |
| -------------------------------------------- | ------------- | ------------------------------------- |
| `.github/dependabot.yml`                     | changed       | The group, its entries, the exclusion |
| `package.json`, `package-lock.json`          | changed       | `@playwright/test` `1.64.1`           |
| `docker/playwright/Dockerfile`               | changed       | The `1.64.1` line of the issue        |
| `scripts/__tests__/playwright-image.test.ts` | changed       | The Dependabot case checks the group  |
| `docs/dependencies.md`                       | changed       | One PR moves both                     |
| `design/*.jpg`                               | changed       | If the snapshots workflow commits     |

## Order of work

1. Change the test. See it fail.
2. Make the other changes. Push.
3. Run `gh workflow run design-agent-shots.yml --ref chore/C792-playwright-group`. If the run denies it, ask the tech lead.

## Risks

- The sandbox cannot check the digest. The CI `e2e` and `design` jobs pull the image.

## Proof

| Acceptance check                  | Proven by                           |
| --------------------------------- | ----------------------------------- |
| The group; `development` excludes | `playwright-image.test.ts`          |
| Both pins `1.64.1`                | The version-match case              |
| Snapshots, `design`, `e2e`        | CI on the branch                    |
| The file accepted; the group PR   | "Check for updates" after the merge |
| The docs step                     | `npm run words`                     |

## Out of scope

- The `ci.yml` comment on the image bump. A workflow change makes a hand-back.
