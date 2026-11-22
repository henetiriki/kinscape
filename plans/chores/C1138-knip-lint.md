# Plan: C1138: Run knip in npm run lint and fix its findings

- **Spec:** #1138
- **Status:** draft

## Approach

The CI build does the rows that need no new package:

- It removes the 25 exports of step 4.
- It adds `knip.json` and the `lint:fix` script.
- It changes the two settings files and `docs/architecture.md`.
- It runs `npm run design-system`.

A local session that the tech lead starts then does the steps of the issue's first Constraint, in that order.

Step 4 removes only the word `export`, so no code path changes at runtime. Nothing in `app/components/foundation/types.ts` uses `TextVariant`, so the build deletes it. `Heading` and `Other` stay, because `Text.tsx` imports them. Each other name has a use in its own file. For a re-export in an `index.ts`, the build deletes the line. The ESLint rule "Export types from the folder's types.ts" allows a type in `types.ts` with no `export`.

`knip.json` holds only the two `ignore` paths and the five `ignoreDependencies` of step 3:

```json
{
  "ignore": ["design/canvas/**", ".claude/skills/**"],
  "ignoreDependencies": [
    "@fontsource-variable/bricolage-grotesque",
    "@fontsource-variable/public-sans",
    "@fontsource/jetbrains-mono",
    "react-18",
    "react-dom-18"
  ]
}
```

knip finds the entry files from its plugins for Next.js, Vitest, Playwright, ESLint, husky, lint-staged and GitHub Actions. The local session sets the `lint` script to `eslint . --max-warnings 0 && knip`. knip then exits with 1 on each of its default issue types.

`gatherTypes` in `lib/design/bundle.mts` keeps a type with no `export` as a plain `type` line. So `components/index.d.ts` loses `TextVariant` and the `export` of four types. That change makes steps 3 to 6 of Changing the design system necessary. No board shows the change: the boards hold only the text "Polity borders", not the `POLITY_LAYER` name.

`docs/code-rules.md` is a [hand-back path](../README.md#hand-back), so the local session builds step 5.

## Decisions

**D5 · The section of the `geojson` types package** · Decides: Tech lead

Step 4 adds `@types/geojson` and does not name the section of `package.json`. Only type imports use it (`features/map/layers/pins.ts`, `features/map/__tests__/layers.test.ts`). `@types/react` is in `devDependencies`, but `@types/pg` is in `dependencies`.

- **A.** `devDependencies`. The app does not need the package at runtime. Cost: none now. The later `--production` Chore can move it.
- **B.** `dependencies`, as `@types/pg`. Cost: none now. The production install gets one more package.
- **Other:** your own.

Recommended: A, because only `npm run typecheck` and `next build` read the types, and `@types/react` sets that precedent.

## Files that change

| File                                  | New / changed | What                                                                                                                       |
| ------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                        | changed       | CI: the `lint:fix` script. Local: the `knip` and `@types/geojson` devDependencies (D5), exact versions; the `lint` script. |
| `package-lock.json`                   | changed       | Local: the lock entries of `knip` and `@types/geojson`.                                                                    |
| `knip.json`                           | new           | The config of the Approach.                                                                                                |
| `features/map/components/Credits.tsx` | changed       | `POLITY_LAYER` loses `export`.                                                                                             |
| `features/map/components/Legend.tsx`  | changed       | `LEGEND_VARS` loses `export`.                                                                                              |
| `features/map/components/MapView.tsx` | changed       | `MIN_ZOOM` and `MAX_ZOOM` lose `export`.                                                                                   |
| `features/map/index.ts`               | changed       | Delete the `DateField` re-export.                                                                                          |
| `features/people/index.ts`            | changed       | Delete the `FuzzyDateField` and `PersonField` re-exports.                                                                  |
| `lib/design/css.mts`                  | changed       | `GENERATED_HEADER` loses `export`.                                                                                         |
| `lib/domain/boundaries/schemas.mts`   | changed       | `boundaryProperties` and `multiPolygon` lose `export`.                                                                     |
| `scripts/safety.mts`                  | changed       | `ADAPTER_IMPORTERS`, `APP_SERVER_MODULES`, `STORAGE_EXEMPT` and `QUERY_FILES` lose `export`.                               |
| `scripts/sources.mts`                 | changed       | `moduleOf` loses `export`.                                                                                                 |
| `app/components/foundation/types.ts`  | changed       | Delete `TextVariant`.                                                                                                      |
| `features/map/types.ts`               | changed       | `DrawingLayer` and `MapMarker` lose `export`.                                                                              |
| `lib/design/types.ts`                 | changed       | `Group` and `SystemStyle` lose `export`.                                                                                   |
| `lib/domain/boundaries/types.ts`      | changed       | `Polity` and `PolityName` lose `export`.                                                                                   |
| `lib/domain/trees/types.ts`           | changed       | `Account`, `NewAccount` and `SeedTree` lose `export`.                                                                      |
| `.github/agent/settings.json`         | changed       | In the Bash hook text, `npm run lint -- --fix` becomes `npm run lint:fix`.                                                 |
| `.github/agent/review-settings.json`  | changed       | The same change.                                                                                                           |
| `docs/architecture.md`                | changed       | _Enforcement_: the knip bullet of step 8, word for word, after the **Lint** bullet.                                        |
| `docs/code-rules.md`                  | changed       | Hand-back row. _Code smells_: the bullet of step 5 replaces the "Wire each export" bullet.                                 |

The design system steps also edit `design/canvas/project/ds/kinscape/`, `design/canvas/project/canvas.json` and `design/canvas/VERSION`. They edit no board.

## Order of work

The CI build agent does steps 1 to 7:

1. Remove the exports and delete `TextVariant`, as the table says.
2. Run `npm run lint`, `npm run typecheck` and `npm test`.
3. Add the `lint:fix` script and `knip.json`. Run `npm run lint:fix` once.
4. Change the hook text of the two settings files.
5. Add the knip bullet to `docs/architecture.md`.
6. Run design system step 2: `npm run design-system`.
7. Push. Keep the PR a draft. In the PR, ask for the local steps.

A local Claude Code session that the tech lead starts does steps 8 to 14, in order. It needs a signed-in account.

8. Run `npm install --save-exact --save-dev knip @types/geojson`, with the section of D5.
9. Set the `lint` script to `eslint . --max-warnings 0 && knip`.
10. Run `npm run lint`. Fix each new finding as step 4 says. Add no ignore.
11. Add `export const KNIP_PROBE = 1;` to `lib/domain/dates/months.mts`. Run `npm run lint`, and paste the line that names `KNIP_PROBE` in the Evidence. Remove the line.
12. Replace the bullet in `docs/code-rules.md`.
13. Run design system steps 3 to 5: `/publish-design-system`, "Updating the install" and "Refreshing the canvas copy".
14. Do design system step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots on the branch.

Then run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- `main` can have more unused code than the run of 2026-11-22 found. Step 10 fixes each new finding, so the diff can grow past the 25 names of step 4. Each extra fix gets one line under `## Deviations`.
- A plugin can miss an entry file, such as a script that only a workflow or a hook command runs. knip then reports it as an unused file. The session adds the path to `entry` in `knip.json`: that is not an ignore. It writes one Deviations line for each path.
- An inferred declaration can need a type that is no longer exported. TypeScript then copies the shape of the type alias, so the declaration build does not fail. `npm run design-system` and `scripts/__tests__/design-system.test.ts` fail if it does.
- `npm run lint` takes the time of one knip run more, in CI and in each local check.

## Proof

| Acceptance check                                                                                   | Proven by                                                                       |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run lint` runs knip and passes                                                                | `npm run lint` output in the Evidence; the `lint` job of `ci.yml`               |
| The Evidence shows `npm run lint` failing on an added unused export, with its name                 | The `KNIP_PROBE` line of step 11                                                |
| The knip config ignores only the paths and packages of step 3                                      | `knip.json` in the diff                                                         |
| `npm run typecheck` and `npm test` pass                                                            | Both outputs in the Evidence (100% coverage)                                    |
| The bullet in `docs/code-rules.md` reads as step 5 says                                            | `git grep -n "only a test uses is not wired" -- docs/code-rules.md`             |
| Steps 2 to 6 of Changing the design system ran on the branch                                       | The step 6 and step 13 commits; the `design` and `gallery` jobs                 |
| Each file under `design/canvas/project/ds/kinscape/` has the sha256 of `.design-system/project/`   | Step 4.6 of "Updating the install"; `sha256sum` of both folders in the Evidence |
| `npm run design:export` prints "No snapshot changed"                                               | `npm run design:export` output in the Evidence                                  |
| `npm run lint:fix` runs ESLint with `--fix` and does not run knip                                  | The `lint:fix` line of `package.json`; its output in the Evidence               |
| The settings files name `npm run lint:fix`; no file outside `plans/` names `npm run lint -- --fix` | `git grep -n "lint -- --fix" -- ":!plans"` prints nothing                       |
| `docs/architecture.md` › _Enforcement_ has the knip bullet                                         | `git grep -n "knip.json" -- docs/architecture.md`                               |

## Out of scope

- The `--production` mode of knip. A later Chore adds it.
- `AGENTS.md` › _Commands_ does not name `npm run lint:fix`. The issue does not ask for it.
- The other sections of `docs/code-rules.md`. #1147 moves them.

## Deviations
