# Plan: C1137: Lint the page rule and the KINSCAPE\_ variable rule

- **Spec:** #1137
- **Status:** approved

## Approach

`eslint.config.mjs` holds both rules as `no-restricted-syntax` selectors (D1, option B). A `BASE_SYNTAX` constant holds the existing selectors: `ARROW_FUNCTIONS`, `TEST_MODIFIERS` and the two type selectors. Each block that sets the rule lists `BASE_SYNTAX` and its own selectors.

- **Page look** reports a `className` or `style` JSX attribute, and an `import` whose source ends in `.css`. A block for `app/**/page.tsx` that ignores `app/screens/**` sets it. Its message is step 2 of the issue, word for word.
- **`KINSCAPE_` reads** report `process.env.KINSCAPE_X`, `process.env['KINSCAPE_X']` (or a template literal with no expression), and each key of an object pattern whose initializer is `process.env`. Its message is step 4 of the issue, word for word. The rule does not tell a read from a write, so `process.env.KINSCAPE_X = '1'` also fails. No file on `main` writes one.
- `envReads(allowed)` builds the selector. It adds a `:not` clause with a regular expression that it builds from the `allowed` array. The main block, the page block and the `types.ts` block call it with no names. A block for `server/env.mts` has no read selector. A later block for `**/__tests__/**`, `e2e/**`, `playwright.config.ts` and `vitest.config.mts` calls it with `TEST_ONLY_VARIABLES`.

`eslint.config.mjs` exports `TEST_ONLY_VARIABLES`. It holds the five `KINSCAPE_` rows that `docs/infrastructure.md` marks "Test-only": `KINSCAPE_DATABASE_CA_FILE`, `KINSCAPE_DEV_PAGES`, `KINSCAPE_MEMORY_ADAPTERS`, `KINSCAPE_MEMORY_SIGN_IN` and `KINSCAPE_TEST_DATABASE_URL`.

On `main`, no page outside `app/screens/` has a `className`, a `style` or a `.css` import. Outside `server/env.mts`, only `playwright.config.ts:32` and `vitest.config.mts:28` read a `KINSCAPE_` variable from `process.env`. Both read a Test-only variable. So `npm run lint` passes with no code change.

[Code rules › Pattern table](../../docs/code-rules.md#pattern-table) says to name the lint rule that fails when a rule breaks. So the two rows of `docs/architecture.md` › _Where does X go_ for a page and a server variable name `no-restricted-syntax`.

`docs/code-rules.md` is a [hand-back path](../README.md#hand-back). CI builds the other rows. The tech lead removes the bullet in a local session.

## Decisions

**D1 · The form of the two rules** · Decides: Tech lead

The issue asks for two ESLint rules. `eslint.config.mjs` already uses `no-restricted-syntax` selectors and the `layers` and `safety` plugins from `scripts/`.

- **A.** Two custom rules in a new `scripts/lint-rules.mts`, as in the Approach. The config test reads `TEST_ONLY_VARIABLES` from the module. Cost: one new module of about 90 lines.
- **B.** `no-restricted-syntax` selectors in `eslint.config.mjs`. The Test-only names go in a selector regular expression. Cost: no new module. Each block replaces the options of the rule, so the page block and the test block must list `ARROW_FUNCTIONS`, `TEST_MODIFIERS` and the two type selectors again. The list test must read the names out of a regular expression.
- **Other:** your own.

**Answer: Other** (@henetiriki). B, with two fixes. Build the regular expression from an array. Use a `BASE_SYNTAX` constant.

## Files that change

| File                                              | New / changed | What                                                                                                                                      |
| ------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                               | changed       | `BASE_SYNTAX`, `TEST_ONLY_VARIABLES`, `envReads`, the page selectors, and the page, `server/env.mts` and test blocks, as in the Approach. |
| `scripts/__tests__/page-env-rules-config.test.ts` | new           | Lints sample text against the real config, as `test-modifiers-config.test.ts` does. One case for each row of Proof. Also the list test.   |
| `docs/architecture.md`                            | changed       | _Where does X go_: the "A screen or route" and "A server variable or table" rows name `no-restricted-syntax`.                             |
| `docs/code-rules.md`                              | changed       | Hand-back row. Remove the `process.env.KINSCAPE_*` bullet from _Code smells_.                                                             |

Also `types/modules.d.ts` declares the `TEST_ONLY_VARIABLES` export of `eslint.config.mjs`.

## Order of work

1. Write `page-env-rules-config.test.ts`. See each "fails" case fail on an empty message list, not on an import error.
2. Build the selectors and blocks in `eslint.config.mjs`. See each case pass.
3. Write the list test (in the same file). Add a fake Test-only `KINSCAPE_` row to `docs/infrastructure.md` once, see the test fail, then remove the row. Paste the failing line in the Evidence.
4. Edit the two rows of `docs/architecture.md`.
5. CI pushes these rows and keeps the PR a draft.
6. The tech lead removes the bullet from `docs/code-rules.md` in a local session.
7. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- The variable rule sees only the three read forms of the issue. It misses `const env = process.env; env.KINSCAPE_X`, a rest pattern and `process['env']`. No file on `main` uses these. A fix costs about 20 lines and a scope check.
- Lint follows the config, so a new test folder outside the four globs gets no `allow`. Its Test-only reads then fail with the rule's message, which names the fix.
- The list test reads the table of `docs/infrastructure.md` by line: a row is ``| `KINSCAPE_<name>` | … | Test-only…``. A change of the table shape makes the test fail, not pass.

## Proof

| Acceptance check                                                                                       | Proven by                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint` passes on the code of `main`                                                            | `npm run lint` on the branch                                                                                                                |
| A page with a `className` prop, a `style` prop or a `.css` import fails                                | `page-env-rules-config.test.ts`: three cases on `app/people/new/page.tsx`                                                                   |
| The same page under `app/screens/` passes                                                              | `page-env-rules-config.test.ts`: the three samples on `app/screens/x/page.tsx`                                                              |
| A component file with a `className` prop passes                                                        | `page-env-rules-config.test.ts`: `app/components/foundation/X.tsx`                                                                          |
| Each of the three read forms fails in a `features/` file                                               | `page-env-rules-config.test.ts`: three cases on `features/map/x.ts`                                                                         |
| The same read passes in `server/env.mts`                                                               | `page-env-rules-config.test.ts`: the three samples on `server/env.mts`                                                                      |
| `parseEnv(process.env)` passes in any file                                                             | `page-env-rules-config.test.ts`: `features/map/x.ts`, `server/x.mts` and `app/page.tsx`                                                     |
| A Test-only variable passes in a `__tests__/` and an `e2e/` file; any other `KINSCAPE_` variable fails | `page-env-rules-config.test.ts`: `KINSCAPE_MEMORY_ADAPTERS` and `KINSCAPE_DATABASE_URL` on `server/__tests__/x.test.ts` and `e2e/x.spec.ts` |
| The list test passes, and fails when a row is added to `docs/infrastructure.md` only                   | The list test; the failing line of Order of work step 3 in the Evidence                                                                     |
| `docs/code-rules.md` no longer holds the bullet                                                        | `git grep -n "KINSCAPE_\*" -- docs/code-rules.md` prints nothing                                                                            |
| `npm test` passes                                                                                      | `npm test` (100% coverage)                                                                                                                  |
| `design/DESIGN.md` and `server/env.mts` do not change                                                  | `git diff origin/main --stat` lists neither file                                                                                            |

## Out of scope

- The page-rule prose in `design/DESIGN.md:128`. A later Chore removes it.
- A script that takes `process.env` as a parameter and reads `env.KINSCAPE_*`, such as `scripts/vercel-ignore.mts` and `scripts/agent-unblock.mts`. The rule sees only reads from `process.env`, as the issue says.
- The other sections of `docs/code-rules.md`. #1147 moves them.

## Deviations

- The Approach follows the answer to D1 (option B). The `:not` clause replaces a negative-lookahead regular expression, which esquery did not apply.
- `docs/code-rules.md`: the tech lead removed the bullet in a local session (hand-back path).
