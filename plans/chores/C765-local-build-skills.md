# Plan: C765: Add /build-local and /fix-review-local skills for a plan PR

- **Spec:** #765
- **Status:** draft

## Approach

Each skill has the frontmatter from #765 and `argument-hint: <PR number>`. The body has these parts:

1. The shared steps (D2).
2. The skill's stop checks.
3. A link to its agent file, then one line per override.

## Decisions

**D1 · Room in `docs/building.md`** · Decides: Tech lead

`docs/building.md` has about 395 words. Its budget is 400. The new line adds about 20.

- **A.** Raise the budget to 450 in `word-count.mts`, with its test case.
- **B.** Cut 20 words from other lines of `docs/building.md`.
- **Other:** your own.

Recommended: A, because B rewrites rules that #765 does not name.

**D2 · Where the shared steps go** · Decides: Tech lead

- **A.** `build-local` holds them under one heading. `fix-review-local` links to that heading.
- **B.** Each skill repeats them.
- **Other:** your own.

Recommended: A, because the writing rules say each fact once.

## Files that change

| File                                       | New / changed | What                  |
| ------------------------------------------ | ------------- | --------------------- |
| `.claude/skills/build-local/SKILL.md`      | New           | The skill             |
| `.claude/skills/fix-review-local/SKILL.md` | New           | The skill             |
| `docs/building.md`                         | Changed       | One line after step 5 |
| `scripts/word-count.mts`                   | Changed       | D1 A: budget          |
| `scripts/__tests__/word-count.test.ts`     | Changed       | D1 A: budget case     |

## Order of work

1. D1 A: change the test case and see it fail. Then change the budget.
2. Write `build-local`, then `fix-review-local`.
3. Add the `docs/building.md` line.
4. Run the checks, then each done check on a plan PR.

## Risks

- `.claude/skills/**` is a hand-back path: the tech lead builds.
- `fix-review-local` skips the reviewer's gaps comment, as #765 says. A CI fix-review run takes it.

## Proof

| Done check                       | Proven by                                   |
| -------------------------------- | ------------------------------------------- |
| Files, frontmatter, links, words | Review, `npm run words`, `format:check`     |
| Push, ready state, replies       | The tech lead runs each skill on a plan PR  |
| Each stop and each session ask   | The tech lead runs each case; no PR comment |

## Out of scope

Agent files, workflows, `plans/README.md`, labels.
