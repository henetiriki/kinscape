# Plan: C975: Add the KinScape issue Types and set them on every issue

- **Spec:** #975
- **Status:** approved

## Approach

A new `scripts/github/issue-types.sh` lists the four Types as `name|COLOUR|description`, like `labels.sh`. `setup-github.sh` reads the live Types with one GraphQL query. It updates a Type that differs, creates a missing Type and deletes each other Type. A second run sends no mutation. `check-github.sh` compares the sorted live list with `issue_types`.

The backfill script lists all issues with `gh issue list --state all --json number,labels,issueType`. It maps `type: <name>` to the Type in `issue_types` and runs `gh issue edit <n> --type <Type>`. These paths are hand-back paths, so the tech lead builds this Chore.

## Decisions

**D1 · Language of the backfill script** · Decides: Tech lead

#976 deletes the script and names no path for it.

- **A.** Bash, `scripts/github/backfill-issue-types.sh`, with no unit test. The live counts prove it.
- **B.** TypeScript, `scripts/backfill-issue-types.mts`, with tests at 100% coverage.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · A row in `docs/repo-settings.md`** · Decides: Tech lead

`docs/repo-settings.md` lists each setting that `setup-github.sh` applies.

- **A.** Add an "Issue Types" row and name Types in line 5.
- **B.** Change no doc.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                  | New / changed | What                                  |
| ----------------------------------------------------- | ------------- | ------------------------------------- |
| `scripts/github/issue-types.sh`                       | new           | The four Types                        |
| `scripts/setup-github.sh`                             | changed       | Create, update and delete Types       |
| `scripts/check-github.sh`                             | changed       | Compare the live Types                |
| `scripts/github/backfill-issue-types.sh`              | new           | One-off: set each Type from its label |
| `.github/ISSUE_TEMPLATE/1-intent.yml` … `4-chore.yml` | changed       | Add `type:`; keep the labels          |
| `docs/repo-settings.md`                               | changed       | Per D2                                |

## Order of work

1. `issue-types.sh` and `check-github.sh`. The check fails on Types.
2. `setup-github.sh`. Run it two times with `env -u GH_TOKEN`, then run the check.
3. The backfill script. Run it two times, then compare the counts.
4. The four forms. After merge, open one test issue from each form, then close it.

## Risks

- A hook denied `gh api graphql`, so the plan run read no live Type. If a personal repo lacks a Type mutation, step 2 fails, and `set -e` shows it.
- A form `type:` that names no live Type can break the form. Step 2 runs before the forms merge.
- No issue has two `type:` labels, so the script does not handle two.

## Proof

| Acceptance check                     | Proven by                                             |
| ------------------------------------ | ----------------------------------------------------- |
| Check passes, reports four Types     | `check-github.sh` output in Evidence                  |
| Second setup run changes nothing     | Its output has no Type line                           |
| Each labelled issue has its Type     | `gh issue list --type` and `--label` counts, per Type |
| Second backfill run changes no issue | Its output: 0 changed                                 |
| #252 and #253 have no Type           | `gh issue view`                                       |
| Each form sets its Type              | Tech lead, four test issues                           |

## Deviations

- `setup-github.sh` and `docs/repo-settings.md` name the `user` token scope: GitHub needs it to manage a personal account's Types.
