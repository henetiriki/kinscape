# Plan: C202: plan-approve and typecheck scripts, ignore .claude-pr

- **Spec:** #202
- **Status:** draft

## Approach

`scripts/approve-plan.mts` exports `run(root, args)`, shaped like `word-count.mts`. It splits `## Decisions` into `**D<n> · …**` blocks, reads each block's `- **<letter>.**` options and checks every answer before writing. The login must match GitHub's login pattern; a leading `@` is dropped. A block already holding an `**Answer:**` line counts as answered, and naming it again replaces that line. Unchosen options stay, as in `plans/DM.12.4-controls-phone.md`.

## Decisions

**D1 · The typecheck script** · Decides: Tech lead
CSS module imports need `next-env.d.ts`, which is git-ignored, so a fresh `tsc --noEmit` likely fails.

- **A.** `next typegen && tsc --noEmit`; `tsconfig.json` also excludes `.claude/worktrees` and `.claude-pr`.
- **B.** `tsc --noEmit` only; it passes after `npm run build` or `npm run dev`.
- **Other:** your own.

Recommended: A, because it passes on a clean checkout.

**D2 · Who an Other answer names** · Decides: Tech lead

- **A.** `**Answer: Other:** <text> (@<login>)`.
- **B.** `**Answer: Other:** <text>`, as the Chore says.
- **Other:** your own.

Recommended: A, because every answer then names its reviewer.

## Files that change

| File                                     | New / changed | What                          |
| ---------------------------------------- | ------------- | ----------------------------- |
| `scripts/approve-plan.mts`               | New           | The script                    |
| `scripts/__tests__/approve-plan.test.ts` | New           | Synthetic plans in a temp dir |
| `package.json`                           | Changed       | `plan-approve`, `typecheck`   |
| `.prettierignore`, `eslint.config.mjs`   | Changed       | Ignore `.claude-pr`           |
| `tsconfig.json`                          | Changed       | Excludes (D1 A only)          |

## Order of work

1. Commit this plan: `plan(C202): approved by @henetiriki`.
2. Tests, then the script.
3. `package.json`, ignores, `tsconfig.json`.
4. Run the checks under _Proof_ and paste their output.

## Proof

| Acceptance check                         | Proven by                                       |
| ---------------------------------------- | ----------------------------------------------- |
| Approves and records answers             | Unit test; a run on a temp copy of a draft plan |
| Missing answer: partial, draft, non-zero | Unit test                                       |
| Unknown decision or letter: unchanged    | Unit test                                       |
| `npm run typecheck` passes               | Its output on a clean checkout                  |
| `.claude-pr/` skipped                    | `npm run format` and `npm run lint` with one    |
| Tests, lint, format, words, validator    | Their output                                    |
