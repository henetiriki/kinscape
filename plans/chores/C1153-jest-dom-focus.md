# Plan: C1153: Use jest-dom for the focus checks, and stop the Testing Library false positives in the lint config

- **Chore:** #1153
- **Requirement IDs:** None: test tooling
- **Status:** approved

## Approach

A local session adds `@testing-library/jest-dom` as a pinned devDependency ([D5](#decisions)). The CI build then does these steps:

- **Focus.** `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`. Each `expect(document.activeElement).toBe(x)` becomes `expect(x).toHaveFocus()`, and `.not.toBe(x)` becomes `expect(x).not.toHaveFocus()`. `SearchBar.test.tsx:66` becomes `expect(document.body).toHaveFocus()`. The plugin does not report `document.body` as node access.
- **Menu.** The `key` helper takes a second argument: the name of the menuitem that has focus. It queries that menuitem by role and name, checks `toHaveFocus()`, then sends the key to it. Each of the 12 calls names its menuitem. The click at `:128` does the same for "Sources". The `onSelect` callback records `matches(':focus')` on the Avatar button, and `:130` expects `[true]` (#1153 D1).
- **Move.** `describe('bundle')` moves unchanged to `lib/design/__tests__/react-18-bundle.test.tsx`. `CASES`, `COMPONENTS`, `rebuild`, `slotted` and the helpers that they use move to `lib/design/__tests__/react-18-cases.tsx` (#1153 D3). The console checks of the file move there too ([D4](#decisions)). `REACT_18_TESTS` lists the two test files (#1153 D2).
- **Lint.** The Testing Library block applies to `**/__tests__/**/*.tsx` and sets `settings: { 'testing-library/custom-renders': 'off' }`. A new block turns off `no-node-access` and `no-container` for the two raw-markup files.
- **Disables.** ESLint 10 reports an unused disable as a warning, and `npm run lint` has `--max-warnings 0`. So lint names each disable that the steps make unnecessary. The build removes each one.

## Decisions

**D4 · The console checks of the moved `bundle` tests** · Decides: Tech lead

On `main`, `react-18.test.tsx:1473` to `:1495` spies on `console.error` and `console.warn` before each test. After each test, it runs `cleanup()`, then fails if the spies have a call. These hooks apply to the `bundle` tests too. #1153 names only `CASES`, `COMPONENTS`, `rebuild` and `slotted`. How does the new file keep these checks?

- **A.** Move `errors`, `warnings`, `quiet` and the two hooks to `react-18-cases.tsx`, in one exported function that registers the hooks and returns `quiet`. Both test files call it at the top. The `cleanup` import and its `no-manual-cleanup` disable move with it. Cost: about 25 moved lines and 2 new lines.
- **B.** Copy the hooks into `react-18-bundle.test.tsx`. Cost: about 20 copied lines, against the "no copied helper" rule of `docs/code-rules.md`.
- **C.** Give the new file no console hooks. Cost: no lines. The `bundle` tests no longer fail on a React warning in the test runner, so this breaks Constraint 2 of #1153.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · When the package lands on the branch** · Decides: Tech lead

The approving review starts the CI build at once ([building](../../docs/building.md#specs-bugs-and-chores)). The build cannot add a package (`npm install` is off). Without the package, `toHaveFocus()` does not exist, so the build cannot do steps 2 to 4 of #1153.

- **A.** Before the approving review, the tech lead's local session adds the package to this branch. It pushes `package.json` and `package-lock.json`. The CI build then builds every other row. Cost: one local step before approval.
- **B.** Approve first. The CI build does steps 5 to 8 and writes a "Big:" line for the package. Then a local session does steps 1 to 4. Cost: two build sessions, and the CI build cannot check the done list.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A side-effect import of the console hooks: an import that registers hooks hides the checks from the reader. D4 A calls a named function.
- One `bundle` test file in the `react-19` project: #1153 D2 rejects it.

## Files that change

| File                                                        | New / changed | What                                                                                                        |
| ----------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `package.json`                                              | Changed       | Local session: `@testing-library/jest-dom`, exact version                                                   |
| `package-lock.json`                                         | Changed       | Local session: the package and its dependencies                                                             |
| `vitest.setup.ts`                                           | Changed       | Import `@testing-library/jest-dom/vitest`                                                                   |
| `vitest.config.mts`                                         | Changed       | `REACT_18_TESTS`, a list of the two files; the `react-19` project excludes both                             |
| `eslint.config.mjs`                                         | Changed       | The `*.tsx` scope and the `custom-renders` setting; the block for the two raw-markup files, with its reason |
| `app/components/actions/__tests__/Tabs.test.tsx`            | Changed       | 5 focus checks                                                                                              |
| `app/components/forms/__tests__/TextField.test.tsx`         | Changed       | 4 focus checks                                                                                              |
| `app/components/forms/__tests__/TokenField.test.tsx`        | Changed       | 1 focus check                                                                                               |
| `app/components/overlays/__tests__/Menu.test.tsx`           | Changed       | 8 focus checks; the `key` helper and its 12 calls, the click and the `onSelect` callback (#1153 D1)         |
| `features/map/components/__tests__/DateDock.test.tsx`       | Changed       | 2 focus checks                                                                                              |
| `features/map/components/__tests__/MapControls.test.tsx`    | Changed       | 1 focus check                                                                                               |
| `features/map/components/__tests__/SearchBar.test.tsx`      | Changed       | 6 focus checks                                                                                              |
| `features/people/components/__tests__/PersonField.test.tsx` | Changed       | 1 focus check                                                                                               |
| `lib/design/__tests__/react-18.test.tsx`                    | Changed       | 3 focus checks; `describe('bundle')`, the shared helpers and the console hooks move out                     |
| `lib/design/__tests__/react-18-bundle.test.tsx`             | New           | `describe('bundle')`, unchanged                                                                             |
| `lib/design/__tests__/react-18-cases.tsx`                   | New           | `CASES`, `COMPONENTS`, `rebuild`, `slotted`, their helpers and the console hooks (D4)                       |
| `app/components/auth/__tests__/SignInHero.test.tsx`         | Changed       | Remove 6 disables                                                                                           |
| `app/__tests__/layout.test.tsx`                             | Changed       | Remove 2 disables                                                                                           |
| `scripts/__tests__/run-summary.test.ts`                     | Changed       | Remove 5 disables                                                                                           |
| `scripts/__tests__/design-export.test.ts`                   | Changed       | Remove 1 disable                                                                                            |
| `lib/design/types.ts`                                       | Changed       | `:94`: the comment names `react-18-cases.tsx`                                                               |
| `docs/architecture.md`                                      | Changed       | `:41`, _Enforced by_: add `react-18-bundle.test.tsx`                                                        |
| `plans/chores/C1153-jest-dom-focus.md`                      | New           | This plan                                                                                                   |

## Order of work

1. Local session (tech lead), before the approving review if D5 is A:
   - Run `npm install --save-dev --save-exact @testing-library/jest-dom`.
   - Push `package.json` and `package-lock.json` to this branch.
2. CI build: record the base counts in the PR. These are the total of `eslint-disable-next-line testing-library/` lines (215 on `main`) and the `npm test` test count.
3. CI build: add the import to `vitest.setup.ts`. Replace the focus checks, one folder per commit. The pre-commit hook lints each staged file, so remove each disable in the same commit. Run the changed test files after each commit.
4. CI build: rewrite the 3 `Menu.test.tsx` lines (#1153 D1).
5. CI build: move `describe('bundle')` and the helpers (D4). Change `vitest.config.mts`. Check the move with `git diff --color-moved`. Commit the move apart from other edits.
6. CI build: change `eslint.config.mjs`. Run `npm run lint`. Remove each disable that lint reports as unused.
7. CI build: change `lib/design/types.ts:94` and `docs/architecture.md:41`.
8. CI build: run the done-check greps of [Proof](#proof). Then run the checks of [Verifying your work](../../AGENTS.md#verifying-your-work).

## Risks

- The jest-dom types can fail to extend the Vitest 5 `Assertion` type. Then `npm run typecheck` fails on `toHaveFocus`. The build adds the type import that the package README gives for Vitest, and writes a line under Deviations.
- The accessible name of the "Export" menuitem includes its detail line. The `key` helper then takes a `RegExp` (`/^Export/`) for that item.
- `custom-renders: 'off'` stops the rules on helpers such as `renderMap` and `renderPin`. On `main`, no disable sits on a line that depends on these helpers, so no other disable turns unused. If lint reports one, the build removes it and writes a line under Deviations.
- The `key` helper checks focus before each key. This adds a check to 12 calls, as #1153 Constraint 3 says. A wrong focus now fails at the key, not at the next check.

## Proof

| Acceptance check                                                    | Proven by                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `package.json` pins `@testing-library/jest-dom` to an exact version | The `package.json` diff                                                               |
| `git grep "document.activeElement" -- '*__tests__*'` finds no line  | The grep output in the PR                                                             |
| No disable in the files of step 8 or in the new test file           | `git grep "eslint-disable-next-line testing-library/"` on those files, in the PR      |
| The disable total falls by at least 59                              | The counts of step 2 and step 8 of the Order of work, in the PR                       |
| `npm run lint` and `npm test` pass, with the same test count        | The `npm run lint` and `npm test` output; the test counts of steps 2 and 8, in the PR |

## Out of scope

- The other 156 disables: a later Chore adds test ids, roles or gallery specs.
- The reason format of each disable: #1155 does it.

## Deviations

- Big: `@testing-library/jest-dom` is not on the branch (D5 A did not happen), and `npm install` is off. The build skips the focus checks, the `vitest.setup.ts` import, the `Menu` rewrite and the disable removals in the test files that those checks change. A local session adds the package, then a second build pass does these rows.
- Lint reported `scripts/__tests__/*.test.ts` disables as errors (the plugin no longer applies to `.ts`), so the build removed them: 5 in `run-summary.test.ts` and 1 in `design-export.test.ts`. `layout.test.tsx` lost 2, and `react-18.test.tsx` lost 15.
- `SignInHero.test.tsx` keeps its 6 disables: lint does not report them as unused.
- The 2 raw-markup files are `react-18.test.tsx` and `react-18-bundle.test.tsx`.
