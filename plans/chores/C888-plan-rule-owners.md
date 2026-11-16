# Plan: C888: Give each plan rule a step that cites it

- **Spec:** #888
- **Status:** approved

## Approach

- `plan-rule-citations.test.ts` lists the owner files with `git ls-files`. A new test names each rule in `plans/README.md` that no owner cites. The anchor check reads `IN_SCOPE` and the owners, so `IN_SCOPE` drops the owner files that it lists.
- `build.md` gets these edits:
  - The `git fetch origin main` command (D1).
  - "Use `origin/main` for `main`" in the Spec-checks bullet of the reword step.
  - Step 2, **Stale facts**. It cites the [stale-facts rule](../README.md#stale-facts), checks only what the issue cites as existing, and stops with a PR comment on a mismatch.
  - A rule that cites `small-departures`.
- `plans/README.md` deletes `draft-before-code`, folds `approval` into `small-departures` and folds `canvas-follow-up` into `design-system`. The `chores` rule drops `approval`.
- `build-local/SKILL.md` gets the override text of the issue. Its last design-system override names "the design-system bullet of `build.md`".

The fetch works in a build run. The repo is public, so the fetch needs no token. `settings.json` allows `Bash(git:*)`, and its hook does not block `git fetch`. `resolve-conflict.md` runs `git fetch --unshallow origin main` in the same runner and checkout, then reads `origin/main`.

## Decisions

**D1 · Where the fetch goes in `build.md`** · Decides: Tech lead

#886 made the reword step step 1, and `load-agent-files.test.ts` pins it.

- **A.** Add the fetch after "Your first command is…": "Then run `git fetch origin main`." The reword step stays step 1.
- **B.** Make the fetch step 1. The reword step becomes step 2, and the test changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | What                                   |
| ----------------------------------------------- | -------------------------------------- |
| `scripts/__tests__/plan-rule-citations.test.ts` | Owner test; `RULE_NAMES`               |
| `scripts/__tests__/load-agent-files.test.ts`    | Pins the fetch, `origin/main`, step 2  |
| `.github/agent/build.md`                        | Fetch; reword bullet; step 2; one rule |
| `plans/README.md`                               | Three rules go; two rules grow         |
| `.claude/skills/build-local/SKILL.md`           | Two overrides                          |
| `scripts/word-count.mts`                        | `build.md` budget, about 530           |
| `scripts/__tests__/word-count.test.ts`          | Its case                               |

## Order of work

1. Add the owner test and the `build.md` cases. See them fail on the missing cites and text.
2. Edit `build.md`, `plans/README.md` and the skill. Raise the budget by the count.
3. Run the Commands checks.

## Risks

- `build.md` has 445 words. The edits add about 80, so the budget rises to about 530.
- A respond run that builds also follows `build.md`. Its checkout keeps the token, so the fetch works there too.

## Proof

| Acceptance check                               | Proven by                                       |
| ---------------------------------------------- | ----------------------------------------------- |
| A rule with no owner cite fails and is named   | The fixture test                                |
| Each rule has a cite; tests pass               | The owner test; `npm test`                      |
| `build.md` step order, cites and `origin/main` | `load-agent-files.test.ts`                      |
| The skill overrides; no step number            | The ready check                                 |
| `plans/README.md` folds; no removed anchor     | `RULE_NAMES`; the anchor test                   |
| Words pass                                     | `npm run words`                                 |
| The first CI build stops on a stale path       | The tech lead checks the first build that fails |
