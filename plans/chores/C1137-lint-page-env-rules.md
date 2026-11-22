# Plan: C1137: Lint the page rule and the KINSCAPE\_ variable rule

- **Spec:** #1137
- **Status:** draft

## Approach

A new module, `scripts/lint-rules.mts`, exports an ESLint plugin with two rules, and the list of Test-only variables. `eslint.config.mjs` loads the plugin as `kinscape` and sets the files of each rule. D1 decides this form.

- **`kinscape/page-look`** reports a `className` or `style` JSX attribute, and an `import` whose source ends in `.css`. It runs on `app/**/page.tsx` and ignores `app/screens/**`. Its message is step 2 of the issue, word for word.
- **`kinscape/env-reads`** reports a member of `process.env` whose name starts with `KINSCAPE_`: `process.env.KINSCAPE_X`, `process.env['KINSCAPE_X']` (or a template literal with no expression), and each key of an object pattern whose initializer is `process.env`. Its message is step 4 of the issue, word for word. The rule does not tell a read from a write, so `process.env.KINSCAPE_X = '1'` also fails. No file on `main` writes one.
- The rule takes one option, `allow`: the names that it does not report. A block for each lint file except `server/env.mts` sets it with no option. A later block for `**/__tests__/**`, `e2e/**`, `playwright.config.ts` and `vitest.config.mts` sets `allow: TEST_ONLY_VARIABLES`.

`TEST_ONLY_VARIABLES` holds the five `KINSCAPE_` rows that `docs/infrastructure.md` marks "Test-only": `KINSCAPE_DATABASE_CA_FILE`, `KINSCAPE_DEV_PAGES`, `KINSCAPE_MEMORY_ADAPTERS`, `KINSCAPE_MEMORY_SIGN_IN` and `KINSCAPE_TEST_DATABASE_URL`.

On `main`, no page outside `app/screens/` has a `className`, a `style` or a `.css` import. Outside `server/env.mts`, only `playwright.config.ts:32` and `vitest.config.mts:28` read a `KINSCAPE_` variable from `process.env`. Both read a Test-only variable. So `npm run lint` passes with no code change.

[Code rules › Pattern table](../../docs/code-rules.md#pattern-table) says to name the lint rule that fails when a rule breaks. So the two rows of `docs/architecture.md` › _Where does X go_ for a page and a server variable name the rules.

`docs/code-rules.md` is a [hand-back path](../README.md#hand-back). CI builds the other rows. The tech lead removes the bullet in a local session.

## Decisions

**D1 · The form of the two rules** · Decides: Tech lead

The issue asks for two ESLint rules. `eslint.config.mjs` already uses `no-restricted-syntax` selectors and the `layers` and `safety` plugins from `scripts/`.

- **A.** Two custom rules in a new `scripts/lint-rules.mts`, as in the Approach. The config test reads `TEST_ONLY_VARIABLES` from the module. Cost: one new module of about 90 lines.
- **B.** `no-restricted-syntax` selectors in `eslint.config.mjs`. The Test-only names go in a selector regular expression. Cost: no new module. Each block replaces the options of the rule, so the page block and the test block must list `ARROW_FUNCTIONS`, `TEST_MODIFIERS` and the two type selectors again. The list test must read the names out of a regular expression.
- **Other:** your own.

Recommended: A, because each rule then has one block, and the list test compares two plain lists.

## Files that change

| File                                   | New / changed | What                                                                                                                                                                                                        |
| -------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lint-rules.mts`               | new           | `pageLookRule`, `envReadsRule`, `TEST_ONLY_VARIABLES` and `plugin`, as in the Approach.                                                                                                                     |
| `eslint.config.mjs`                    | changed       | A page block for `kinscape/page-look`. Two blocks for `kinscape/env-reads`: all lint files except `server/env.mts`, then the test files with `allow`. Each block has a comment that names the issue's rule. |
| `scripts/__tests__/lint-rules.test.ts` | new           | Lints sample text against the real config, as `layers-config.test.ts` does. One case for each row of Proof. Also the list test.                                                                             |
| `docs/architecture.md`                 | changed       | _Where does X go_: the "A screen or route" row names `kinscape/page-look`. The "A server variable or table" row names `kinscape/env-reads`.                                                                 |
| `docs/code-rules.md`                   | changed       | Hand-back row. Remove the `process.env.KINSCAPE_*` bullet from _Code smells_.                                                                                                                               |

## Order of work

1. Write `lint-rules.mts` with both rules as `create: () => ({})`, and wire them in `eslint.config.mjs`.
2. Write `lint-rules.test.ts`. See each "fails" case fail on an empty message list, not on an import error.
3. Build the two rules. See each case pass.
4. Write the list test. Add a fake Test-only `KINSCAPE_` row to `docs/infrastructure.md` once, see the test fail, then remove the row. Paste the failing line in the Evidence.
5. Edit the two rows of `docs/architecture.md`.
6. CI pushes these rows and keeps the PR a draft.
7. The tech lead removes the bullet from `docs/code-rules.md` in a local session.
8. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- The variable rule sees only the three read forms of the issue. It misses `const env = process.env; env.KINSCAPE_X`, a rest pattern and `process['env']`. No file on `main` uses these. A fix costs about 20 lines and a scope check.
- Lint follows the config, so a new test folder outside the four globs gets no `allow`. Its Test-only reads then fail with the rule's message, which names the fix.
- The list test reads the table of `docs/infrastructure.md` by line: a row is ``| `KINSCAPE_<name>` | … | Test-only…``. A change of the table shape makes the test fail, not pass.

## Proof

| Acceptance check                                                                                       | Proven by                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint` passes on the code of `main`                                                            | `npm run lint` on the branch                                                                                                     |
| A page with a `className` prop, a `style` prop or a `.css` import fails                                | `lint-rules.test.ts`: three cases on `app/people/new/page.tsx`                                                                   |
| The same page under `app/screens/` passes                                                              | `lint-rules.test.ts`: the three samples on `app/screens/x/page.tsx`                                                              |
| A component file with a `className` prop passes                                                        | `lint-rules.test.ts`: `app/components/foundation/X.tsx`                                                                          |
| Each of the three read forms fails in a `features/` file                                               | `lint-rules.test.ts`: three cases on `features/map/x.ts`                                                                         |
| The same read passes in `server/env.mts`                                                               | `lint-rules.test.ts`: the three samples on `server/env.mts`                                                                      |
| `parseEnv(process.env)` passes in any file                                                             | `lint-rules.test.ts`: `features/map/x.ts`, `server/x.mts` and `app/page.tsx`                                                     |
| A Test-only variable passes in a `__tests__/` and an `e2e/` file; any other `KINSCAPE_` variable fails | `lint-rules.test.ts`: `KINSCAPE_MEMORY_ADAPTERS` and `KINSCAPE_DATABASE_URL` on `server/__tests__/x.test.ts` and `e2e/x.spec.ts` |
| The list test passes, and fails when a row is added to `docs/infrastructure.md` only                   | The list test; the failing line of Order of work step 4 in the Evidence                                                          |
| `docs/code-rules.md` no longer holds the bullet                                                        | `git grep -n "KINSCAPE_\*" -- docs/code-rules.md` prints nothing                                                                 |
| `npm test` passes                                                                                      | `npm test` (100% coverage)                                                                                                       |
| `design/DESIGN.md` and `server/env.mts` do not change                                                  | `git diff origin/main --stat` lists neither file                                                                                 |

## Out of scope

- The page-rule prose in `design/DESIGN.md:128`. A later Chore removes it.
- A script that takes `process.env` as a parameter and reads `env.KINSCAPE_*`, such as `scripts/vercel-ignore.mts` and `scripts/agent-unblock.mts`. The rule sees only reads from `process.env`, as the issue says.
- The other sections of `docs/code-rules.md`. #1147 moves them.

## Deviations
