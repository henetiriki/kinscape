# Plan: C1182: Ban disables of max-lines-per-function in lint, and delete the length-disables test

- **Spec:** #1182
- **Requirement IDs:** None. This Chore changes no app behaviour.
- **Status:** approved

## Approach

The `max-lines-per-function` block in `eslint.config.mjs` also turns on `@eslint-community/eslint-comments/no-restricted-disable` with `'max-lines-per-function'`. The `comments.recommended` block already loads the plugin for each file, so the block needs no `plugins` key. The rule reports each disable that names the rule, in each form: block, same line, next line and rule list. It also reports a disable with no rule list, but `main` has none outside `__tests__/` and `e2e/`. After #1181, `main` has no disable of the rule, so lint passes. The fitness test `length-disables.test.ts` then has no job, and it goes. `tracked.ts` stays, because `later-tags.test.ts` imports it.

## Decisions

**D1 · A committed test of the new rule** · Decides: Tech lead

The issue proves the rule with a scratch disable in the PR Evidence only. Three tests on `main` already lint text against the real config with `lintConfig` (`scripts/__tests__/lint-config.ts`), such as `test-modifiers-config.test.ts`. #1182 asks for no new test. No related issue holds a value for this.

- **A.** Add `scripts/__tests__/function-length-config.test.ts`. It lints the four disable forms in `lib/x.mts` and expects the message `Disabling 'max-lines-per-function' is not allowed.` for each. It also lints the next-line form in `lib/__tests__/x.test.ts` and expects no message from the rule. Cost: one new file of about 30 lines, outside the four steps of the issue.
- **B.** Prove the rule only with the scratch disable in the Evidence. Cost: a later edit can drop the rule from the config, and no check fails.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **A new `no-restricted-syntax` selector on comments.** ESLint selectors do not match comments.
- **A ban in each file of the repo, tests too.** The issue limits the rule to the files of the `max-lines-per-function` block.

## Files that change

| File                                               | New / changed | What                                                                                                                                                                                                          |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                                | Changed       | Line 225: the comment says that `no-restricted-disable` bans a disable of the rule. The block's `rules` add `'@eslint-community/eslint-comments/no-restricted-disable': ['error', 'max-lines-per-function']`. |
| `scripts/__tests__/length-disables.test.ts`        | Deleted       | The fitness test and its 7 cases go.                                                                                                                                                                          |
| `scripts/__tests__/function-length-config.test.ts` | New (D1 A)    | The cases of D1 A.                                                                                                                                                                                            |
| `docs/architecture.md`                             | Changed       | Line 50: remove the `length-disables` item from **Fitness tests**.                                                                                                                                            |

## Order of work

1. If D1 is A, write `function-length-config.test.ts` first. See it fail on the missing message. Paste the failing line in the Evidence.
2. Add the rule and change the comment in `eslint.config.mjs`.
3. Add a scratch `// eslint-disable-next-line max-lines-per-function -- x` above a function of more than 60 lines in `lib/`. Run `npm run lint`. Paste the `no-restricted-disable` error in the Evidence. Revert the scratch line.
4. `git rm -f scripts/__tests__/length-disables.test.ts`.
5. Edit line 50 of `docs/architecture.md`.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- A scratch disable above a function of 60 lines or fewer fails lint as an unused disable, even with no ban. Step 3 puts it above a longer function, and the Evidence shows the `no-restricted-disable` message, not the unused-disable warning.
- A disable of `no-restricted-disable` itself can hide a disable of the length rule. No path on `main` does this, and `require-description` makes the reason show in review. A fix costs one more rule entry. This plan builds no guard.

## Proof

| Acceptance check                                                        | Proven by                                                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A scratch disable makes `npm run lint` fail, and is not committed.      | Step 3 output in the Evidence; the diff has no scratch line. D1 A adds the config test. |
| `git grep length-disables` finds no line outside `plans/`.              | `git grep length-disables -- ':!plans/'` output in the Evidence.                        |
| `npm run lint`, `npm run words` and `npm test` pass with 100% coverage. | The check output in the Evidence.                                                       |

## Out of scope

- The `max-lines-per-function` limit and its `ignores`.
- `scripts/__tests__/tracked.ts` and its importers.

## Deviations
