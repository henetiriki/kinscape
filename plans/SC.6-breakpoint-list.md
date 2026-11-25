# Plan: SC.6: Every layout switch takes its width from the breakpoint list

- **Spec:** #1198
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

A new module, `lib/design/breakpoints.mts`, reads the named queries from `breakpoint.$extensions.kinscape.queries` in the token file. A query refers to a width or height token as `{breakpoint.phone-width}`, and `resolvedText` gives its value. Three readers use the module:

- The Style Dictionary format writes the export `breakpointQuery`.
- `npm run tokens` rewrites each marked `@media` condition in the tracked CSS files.
- `breakpoints.test.ts` checks each `.module.css` file and `app/globals.css`.

The marker sits between the condition and `{`: `@media (max-width: 639.98px), (max-height: 499.98px) /* breakpoint: phone */ {`. Thus, the condition is the text between `@media` and the marker, and the rewrite changes only that text. The size check reads `@media` lengths from uncommented text, so the marker does not change it.

## Files that change

| File                                                                                                                                                                                                                              | New / changed | What                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/kinscape.tokens.json`                                                                                                                                                                                                     | changed       | `breakpoint.$extensions.kinscape.queries.phone`: `(max-width: {breakpoint.phone-width}), (max-height: {breakpoint.phone-height})`.                                                                                                                          |
| `lib/design/breakpoints.mts`                                                                                                                                                                                                      | new           | `queriesOf(tokens)`: each named query, resolved. `mediaProblems(file, text, queries)`: an unmarked width or height `@media` (file and line), an unknown marker (the marker), a stale condition (the file). `withQueries(text, queries)`: the rewritten CSS. |
| `lib/design/style-dictionary.mts`                                                                                                                                                                                                 | changed       | The TypeScript format adds `export const breakpointQuery = { phone: "…" } as const`.                                                                                                                                                                        |
| `design/tokens.generated.ts`                                                                                                                                                                                                      | changed       | Written by `npm run tokens`.                                                                                                                                                                                                                                |
| `scripts/tokens.mts`                                                                                                                                                                                                              | changed       | `run(root, files)` also rewrites each marked `@media` in the `.module.css` files and `app/globals.css` of `files`. The direct run passes `git ls-files`, as `scripts/sizes.mts` does. An unknown marker throws and names it.                                |
| `app/globals.css` and the 16 `.module.css` files with the phone query (17 rules)                                                                                                                                                  | changed       | Each `@media` gets `/* breakpoint: phone */`. No condition changes.                                                                                                                                                                                         |
| `app/components/foundation/usePhone.ts`                                                                                                                                                                                           | changed       | `PHONE` is `breakpointQuery.phone`. The template string goes.                                                                                                                                                                                               |
| `lib/design/__tests__/breakpoints.test.ts`                                                                                                                                                                                        | new           | Unit tests of the three functions. One test reads each tracked `.module.css` file and `app/globals.css`, and expects no problem.                                                                                                                            |
| `lib/design/__tests__/style-dictionary.test.ts`                                                                                                                                                                                   | changed       | The export holds the resolved query. A changed width changes it.                                                                                                                                                                                            |
| `scripts/__tests__/tokens.test.ts`                                                                                                                                                                                                | changed       | `run` rewrites a marked condition, leaves an unmarked file as it is, and throws on an unknown marker.                                                                                                                                                       |
| `app/components/auth/__tests__/SignInHero.test.tsx`, `app/components/layout/__tests__/ColumnLayout.test.tsx`, `app/components/layout/__tests__/SignInLayout.test.tsx`                                                             | changed       | The text before `{` is `@media ${breakpointQuery.phone} /* breakpoint: phone */ `.                                                                                                                                                                          |
| `app/components/actions/__tests__/ActionBar.test.tsx`, `app/components/forms/__tests__/TextAreaField.test.tsx`, `app/components/foundation/__tests__/PageHeader.test.tsx`, `features/map/components/__tests__/DateField.test.tsx` | changed       | Each test matches the marker, not `639.98px`. A width change then needs no test edit.                                                                                                                                                                       |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts`                                                                                                                                                                  | changed       | The `design/topics/tokens.md` budget goes from 640 to 700 words. The test pins that number.                                                                                                                                                                 |
| `lib/design/__tests__/design.test.ts`                                                                                                                                                                                             | changed       | The guard "writes every media query size from breakpoint" goes. `breakpoints.test.ts` covers it: it reads the same CSS files, and a `min-width` or `min-height` `@media` fails as unmarked.                                                                 |
| `design/topics/components.md`                                                                                                                                                                                                     | changed       | The bullet on the media query test names `scripts/tokens.mts` and `breakpoints.test.ts`.                                                                                                                                                                    |
| `design/topics/tokens.md`                                                                                                                                                                                                         | changed       | A part "Breakpoints": change a width, add a query. The `breakpointQuery` export in The CSS. The checks name `breakpoints.test.ts`.                                                                                                                          |
| `docs/architecture.md`                                                                                                                                                                                                            | changed       | "Tokens are the one source": `lib/design/breakpoints.mts` in _Where_, `breakpoints.test.ts` in _Enforced by_.                                                                                                                                               |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                                                                                                                                         | changed       | Steps 3 to 5 of Changing the design system.                                                                                                                                                                                                                 |

## Order of work

1. Write `breakpoints.test.ts` and the export, rewrite and test changes, and see them fail.
2. Add the `$extensions` and `lib/design/breakpoints.mts`. Change `style-dictionary.mts` and `scripts/tokens.mts`. Run `npm run tokens`.
3. Add the markers. Change `usePhone.ts`. Run `npm run tokens` again, and see that no condition changes.
4. Change `tokens.md` and `architecture.md`.
5. Change `phone-width` to `600px` and run `npm run tokens`. Record `git diff --stat` in the PR Evidence. Revert the change.
6. Run the checks in AGENTS.md › Commands.
7. Steps of [Changing the design system](../design/CANVAS.md#changing-the-design-system). No board shows the change, so step 7 does not run.
   1. Step 2: `npm run design-system` on `main` and on the branch. Record both sha256 lists and the `design-system.json` diff.
   2. Steps 3 to 5: the tech lead, or a local Claude Code session that the tech lead starts, runs them. The session needs a signed-in account. The PR stays a draft until then.
   3. Step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots on it.

## Risks

- The plan run could not run Prettier on a marked line (the command needed approval). If Prettier moves the marker off the `@media` line, the build stops and asks before it puts the marker elsewhere.
- A component CSS file that gets a new width `@media` with no marker fails `breakpoints.test.ts`. The message names the marker to add.
- `e2e/pins.spec.ts:99` and `WIDTHS` in `e2e/map-desktop.spec.ts` hold `640`. A later width change needs them changed too. This Spec changes no width.

## Proof

| Acceptance check                            | Proven by                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| 1. `npm run tokens` changes no condition    | Step 3: `git diff` shows only the marker on each `@media` line              |
| 2. A test width change                      | `tokens.test.ts`, `style-dictionary.test.ts`; step 5 `git diff --stat`      |
| 3. An unmarked `@media` names file and line | `breakpoints.test.ts`                                                       |
| 4. An unknown marker names the marker       | `breakpoints.test.ts`                                                       |
| 5. A stale condition names the file         | `breakpoints.test.ts`                                                       |
| 6. The phone form as on `main`              | `npm run e2e` (`map-phone.spec.ts`, `navigation.spec.ts`, `people.spec.ts`) |
| 7. The design system file list              | Both sha256 lists in the PR Evidence                                        |
| 8. `design-system.json` stamps only         | The diff in the PR Evidence                                                 |
| 9. The checks in AGENTS.md › Commands       | Their output in the PR Evidence                                             |
| 10. Steps 2 to 6                            | The commits of steps 3 to 5, and the CI run of step 6                       |
| 11. The canvas copy sha256                  | The sha256 compare of step 5.2                                              |

## Out of scope

- A tablet query and its designs (#1188, Out of scope).
- The e2e viewport sizes that hold `640`.

## Deviations

- The phone query has 18 rules in 17 files, not 17 rules: `TextField.module.css` holds two.
- Big: the `design/topics/tokens.md` budget goes from 640 to 700 words, for the "Breakpoints" part. The tech lead added both word-count files to Files that change.
- `scripts/tokens.mts`: `files` is optional in `run(root, files = [])`, so a call with only `root` rewrites no CSS.
- `scripts/tokens.mts`: `run` computes each text before it writes, so an unknown marker writes no file.
- `lib/design/breakpoints.mts`: it also exports `isStyleFile`, which `scripts/tokens.mts` and `breakpoints.test.ts` share. A marker name is checked with `Object.hasOwn`, so `constructor` is unknown.
- At the tech lead's request, the old guard in `design.test.ts` goes. Its bullet in `design/topics/components.md` changes. `npm run design-system` still gives the same `checksums.json`, so steps 3 to 5 send nothing new.
- The build did not record the failing line of step 1. Evidence holds the failing line of each guard instead.
