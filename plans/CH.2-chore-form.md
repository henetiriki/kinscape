# Plan: CH.2: Chore form, label and plan rules

- **Spec:** #180
- **Requirement IDs:** none (process change)
- **Status:** approved

## Approach

Add `.github/ISSUE_TEMPLATE/4-chore.yml`, modelled on the Bug form: title `Chore: `, labels `type: chore` and `status: ready-for-dev`, a markdown intro with the Spec's two rules, then four textareas (the last optional). In `scripts/setup-github.sh`, add a `type: chore` line to the type labels and drop it from the delete loop; otherwise setup creates it and then deletes it. Add a 300-word budget for `/^plans\/chores\/[^/]+\.md$/` to `scripts/word-count.mts`; the default run already walks `plans/` recursively. Rewrite `plans/README.md` rule 4 and the two places in `docs/how-we-work.md` the Spec names. The spec agent workflow only acts on `type: spec` or `type: bug`, so a chore issue starts nothing (CH.3).

## Decisions

**D1 · `docs/building.md` › _Chores_** · Decides: Tech lead
It says chores need no issue and the plan isn't committed. After this change, that is only true of the quick route.

- **A.** Reword it to describe the quick route, and link to plan rule 4 for a chore filed as an issue.
- **B.** Leave it; the Spec doesn't list the file.
- **Other:** your own.

Recommended: A, because otherwise two docs disagree about chore plans.

**Answer: A** (@henetiriki)

**D2 · Branch for a filed chore** · Decides: Tech lead
Rule 3 names `spec/` and `bug/` branches; rule 4 says rule 3 applies to `C<n>` but gives no branch.

- **A.** Add `chore/C<n>-<slug>` to rule 3's branch list.
- **B.** Leave it to CH.3.
- **Other:** your own.

Recommended: A, because otherwise rule 4 points at a rule with no branch for a chore.

**Answer: A** (@henetiriki)

## Alternatives considered

- A label check in `check-github.sh`: not in the Spec, and the script checks no labels today.

## Files that change

| File                                   | New / changed | What                                                       |
| -------------------------------------- | ------------- | ---------------------------------------------------------- |
| `.github/ISSUE_TEMPLATE/4-chore.yml`   | New           | Chore form                                                 |
| `scripts/setup-github.sh`              | Changed       | Create `type: chore`; stop deleting it                     |
| `scripts/word-count.mts`               | Changed       | `plans/chores/*.md` budget 300                             |
| `scripts/__tests__/word-count.test.ts` | Changed       | Budget, pass at 300, fail at 301, picked up by default run |
| `plans/README.md`                      | Changed       | Rule 4 (and rule 3 if D2 is A)                             |
| `docs/how-we-work.md`                  | Changed       | `chore` among the types; Chore row beside the quick route  |
| `docs/building.md`                     | Changed       | _Chores_ (if D1 is A)                                      |
| `plans/CH.2-chore-form.md`             | New           | This plan                                                  |

## Order of work

1. Commit this plan: `plan(CH.2): approved by @henetiriki`.
2. Word budget and tests; `npm test` at 100%.
3. Form and setup script; `bash -n scripts/setup-github.sh`.
4. Docs: `plans/README.md`, `docs/how-we-work.md`, then `docs/building.md` if D1 is A.
5. Run lint, format check, tests, boundary validator, `npm run words` and `npm run e2e`.
6. PR body lists the post-merge steps for the tech lead: setup, `gh label list --search "type: chore"`, `check-github.sh`, open the Chore form.

## Risks

- **Doc budgets:** `docs/how-we-work.md` and `docs/building.md` are near theirs; I trim nearby text rather than raise one.
- **Form only shows after merge:** GitHub reads issue forms from `main`. If the YAML is invalid, the chooser shows an error and a follow-up fixes it.
- **`AGENTS.md` calls the chore plan budget unenforced:** still true for a PR-body plan. Left alone: the Spec doesn't list it.

## Proof

| Acceptance check                               | Proven by                                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Chore form has the boxes and labels            | After merge, the tech lead picks Chore in the chooser and files a test issue                                      |
| `type: chore` exists, no drift                 | After merge, the tech lead runs setup, then `gh label list --search "type: chore"` and `check-github.sh` (all ✅) |
| `plans/chores/` over 300 fails, 300 passes     | Unit tests in `word-count.test.ts`; coverage stays 100%                                                           |
| Docs say a no-issue `chore:` PR works as today | Rule 4 and the _Which issue do I need?_ table, quoted in the PR body                                              |

## Out of scope

CODEOWNERS (CH.1); the agent planning and building a chore, and the hand-back rule (CH.3).
