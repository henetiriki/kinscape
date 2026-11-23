# Plan: C1172: Fail lint on an export that only a test uses

- **Spec:** #1172
- **Requirement IDs:** None. This Chore changes tooling only.
- **Status:** draft

## Approach

A new `knip.ts` marks the scripts, `lib/design`, `server/db/migrate.mts` and each `CONTROLS` path as production entries. `knip --production` then reports only exports that no production code reaches. A new `lint:knip` script runs `knip` and `knip --production`, in its own CI step. The six exports that it reports get the fixes of step 3. A fitness test, `scripts/__tests__/later-tags.test.ts`, fails on a `@later` tag with no issue number.

On `main`, `knip --production` with `knip.json` reports 32 exports. Each export outside the six has a use in its own file, or a script, `lib/design` file or `CONTROLS` path uses it. Thus `ignoreExportsUsedInFile` and the new entries remove each one.

## Decisions

**D2 · Where `alertCodes` goes** · Decides: Tech lead

Step 3 says: "Move it into the tests that use it." Two tests import it: `relationship-messages.test.ts` and `RelationshipDetails.test.tsx`. It is `Object.keys(MESSAGES)`, and `MESSAGES` is private, so a test must list the codes itself. "Define a type or constant once" (`docs/code-rules.md:10`) applies, as in D1.

- **A.** Add `features/people/components/__tests__/alert-codes.ts`. It holds a `Record<AlertCode, true>` and exports its keys as `ALERT_CODES`. `npm run typecheck` fails when an `AlertCode` has no key. Both tests import it. Delete the test "lists every code that shows an alert", because the type now does its job. Cost: one new test helper.
- **B.** Copy the list of eight codes into each test. Cost: two copies, and no check finds a new code that a copy misses.
- **Other:** your own.

Recommended: A, because one copy holds the codes and the type keeps them complete.

**D3 · Name the `@later` test in _Enforcement_** · Decides: Tech lead

`docs/code-rules/pattern-table.md` says: "When you add a pattern, rule or guard, name the test or lint rule that fails when it breaks." The text of step 6 names knip but not the test of step 4.

- **A.** Also add `later-tags` (`@later` tags with no issue) to the **Fitness tests** line, `docs/architecture.md:50`. Cost: one more edit outside step 6.
- **B.** Write only the text of step 6. Cost: no doc names the test of step 4.
- **Other:** your own.

Recommended: A, because the pattern-table rule asks for the test name.

## Files that change

| File                                                                 | New / changed | What                                                                          |
| -------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `knip.ts`                                                            | New           | The config of step 1. It imports `CONTROLS` from `#ks/lib/design/bundle.mts`. |
| `knip.json`                                                          | Deleted       | `git rm`.                                                                     |
| `package.json`                                                       | Changed       | `lint` runs ESLint only. A new `lint:knip` runs `knip && knip --production`.  |
| `app/@map/actions.ts`                                                | Changed       | `/** @later #884 */` on `updatePinAction`.                                    |
| `features/people/components/relationship-messages.ts`                | Changed       | Remove `alertCodes`.                                                          |
| `features/people/components/__tests__/alert-codes.ts`                | New           | `ALERT_CODES` (D2 A).                                                         |
| `features/people/components/__tests__/relationship-messages.test.ts` | Changed       | Delete "lists every code that shows an alert" (D2 A).                         |
| `features/people/components/__tests__/RelationshipDetails.test.tsx`  | Changed       | `it.each(ALERT_CODES)`, from the helper.                                      |
| `features/people/index.ts`                                           | Changed       | Remove the `usePeople` re-export.                                             |
| `features/people/__tests__/query.test.tsx`                           | Changed       | Import `usePeople` from `@ks/features/people/query`.                          |
| `lib/domain/boundaries/model.mts`                                    | Changed       | Remove `nameOn`, `boundaryOn` and the imports that only they use.             |
| `lib/domain/boundaries/__tests__/model.test.ts`                      | Changed       | Delete the tests of `nameOn` and `boundaryOn`.                                |
| `lib/domain/map/view.mts`                                            | Changed       | Remove `centreOf` and its `mercatorY` import.                                 |
| `e2e/view.ts`                                                        | New           | `centreOf`, as on `main` (#1172 D1).                                          |
| `lib/domain/map/__tests__/view.test.ts`                              | Changed       | Import `centreOf` from `@ks/e2e/view`.                                        |
| `e2e/map-zoom.spec.ts`                                               | Changed       | Import `centreOf` from `@ks/e2e/view`.                                        |
| `scripts/__tests__/later-tags.test.ts`                               | New           | The test of step 4.                                                           |
| `docs/architecture.md`                                               | Changed       | Line 49: the text of step 6. Line 50: `later-tags` (D3 A).                    |
| `.github/workflows/ci.yml`                                           | Changed       | Tech lead: the step "Find unused code", and "the four" in the job comment.    |
| `AGENTS.md`                                                          | Changed       | Tech lead: `npm run lint:knip` after `npm run lint`.                          |
| `docs/code-rules.md`                                                 | Changed       | Tech lead: remove the bullet of step 5.                                       |

## Order of work

1. Add `knip.ts`. Delete `knip.json`. Change `package.json`. Run `npm run lint:knip`, and check that it reports only the six exports of step 3.
2. Fix the six exports, with the test changes above. Run `npm run lint:knip` until it passes.
3. Write `later-tags.test.ts` test first. Its `untagged(files)` function takes a map of path to text and returns each `path:line` where `@later` has no ` #<number>` after it. The test builds the tag text from parts, so the test file does not match itself. See the case "flags `@later` with no number" fail before you write the regular expression. Then a case reads the tracked files from `git ls-files '*.ts' '*.tsx' '*.mts'`, drops `design/canvas/`, and expects no result.
4. Edit `docs/architecture.md`.
5. In the PR Evidence, add a scratch export that only a test imports. Paste the failure of `npm run lint:knip`. Remove the scratch change.
6. The tech lead builds the three hand-back rows in a local session.

## Risks

- knip loads `knip.ts` with its own TypeScript loader. If the loader does not resolve the `#ks/*` imports of `bundle.mts`, the config fails to load. Step 1 shows this first. If it fails, stop and ask the tech lead, because an acceptance check names the import.
- The `quality` job gets the new step only when the tech lead builds `ci.yml`. Until then, CI runs no knip at all, because `lint` no longer calls it. Merge the PR only with all rows built.
- A unit test now imports from `e2e/`. `scripts/layers.mts` lets a test file do this, and `e2e/` is outside the coverage scope.

## Proof

| Acceptance check                                                               | Proven by                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `knip.json` is gone. `knip.ts` imports `CONTROLS`.                             | The diff.                                                    |
| `npm run lint:knip` passes.                                                    | The pasted output, and the CI step "Find unused code".       |
| A scratch export that only a test imports fails `npm run lint:knip`.           | The pasted failure in the PR Evidence.                       |
| The `quality` job runs "Find unused code". `npm run lint` runs ESLint only.    | The diff of `ci.yml` and `package.json`. The CI run.         |
| `AGENTS.md` lists `npm run lint:knip`.                                         | The diff.                                                    |
| `updatePinAction` has `@later #884`. The other five exports are gone.          | The diff, and `npm run lint:knip`.                           |
| The step-4 test fails with no number and passes with `#884`.                   | `later-tags.test.ts`, with the failing line in the Evidence. |
| The bullet of step 5 is gone. `docs/architecture.md:49` holds the step-6 text. | The diff.                                                    |
| Lint, typecheck, words and tests pass, with 100% coverage.                     | The pasted output.                                           |
| The `quality` job keeps its name. knip stays at 6.47.0.                        | The diff of `ci.yml` and `package-lock.json` (no change).    |
| Each `@later` tag names an open issue.                                         | `@later #884` only. #884 is open.                            |

## Out of scope

- The check in #884 that removes the `@later #884` tag. Its `/refine spec` run adds it.
- Other prose rules that a lint rule could replace.

## Deviations
