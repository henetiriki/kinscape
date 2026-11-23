# Plan: SC.3: The token file moves to the standard format, and Style Dictionary builds the CSS

- **Spec:** #1193
- **Requirement IDs:** None. This Spec changes tooling only.
- **Status:** approved

## Approach

A one-off script outside the repo converts `design/tokens.json` into `design/kinscape.tokens.json` (DTCG 2025.10). `scripts/tokens.mts` gives the parsed file to Style Dictionary as `tokens`, with custom hooks from `lib/design/style-dictionary.mts`. Two custom formats write `app/tokens.css` and `design/tokens.json`. The CSS format reuses `cssName`, `fontStack` and `MAP_SHARED` from `lib/design/css.mts`, so the old writer goes now (D2). `lib/design/dtcg.mts` holds the value writers and the DTCG check. The stale test compares both outputs with the files.

## Decisions

**D1 · The format of the generated `design/tokens.json`** · Decides: Tech lead

- **A.** The build writes `JSON.stringify(tree, null, 2)`. `.prettierignore` adds the file. About 60 lines of inline `map` objects expand. The parsed JSON stays equal.
- ~~**B.** The build runs the Prettier API on its output.~~

**Answer: A** (Tech lead)

**D2 · The old CSS writer** · Decides: Tech lead

#1196 (SC.4.2) says: "Its CSS writer goes, because Style Dictionary writes the CSS."

- **A.** SC.3 deletes `renderCss`, `cssVariables` and `GENERATED_HEADER`. The new format reuses `cssName`, `fontStack` and `MAP_SHARED`. The build removes the `lib/design/css.mts` CSS-writer clause from #1196.
- ~~**B.** Keep the writer until SC.4.2.~~

**Answer: A** (Tech lead)

**D3 · The first conversion** · Decides: Tech lead

- **A.** A throwaway script outside the repo writes the first `design/kinscape.tokens.json`. Acceptance checks 1 and 2 prove it.
- ~~**B.** Commit a converter script.~~

**Answer: A** (Tech lead)

**D4 · The colour value** · Decides: Tech lead

- **A.** Each colour has `colorSpace: "srgb"`, `components` (4 decimals) and `hex`. A colour with opacity also has `alpha`. The writer reads `hex` and `alpha`. It throws on a colour with no `hex`.
- ~~**B.** Components only, with rounding.~~

**Answer: A** (Tech lead)

## Alternatives considered

- Built-in `css/variables` format: it writes a multi-line header and kebab names. The first line must stay one line, so a custom format is needed.
- Style Dictionary `source` globs: these read relative to the working directory. `tokens` takes the parsed object, so the tests can use a temp root.

## Files that change

| File                                                                                      | New / changed | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`, `package-lock.json`                                                       | changed       | Add `style-dictionary` `5.8.0` (exact) to `devDependencies`.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `design/kinscape.tokens.json`                                                             | new           | Every token, with `$type`, `$value` and `$description` from `notes`. The types follow Behaviour. Each value with a reference keeps `{group.name}`. Each shadow is one object, or a list for two parts.                                                                                                                                                                                                                                                                                                                   |
| `lib/design/types.ts`                                                                     | changed       | The DTCG types: `DtcgColour`, `DtcgDimension`, `DtcgShadow`, `DtcgTransition`, `DtcgToken`, `DtcgTree`.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lib/design/dtcg.mts`                                                                     | new           | Value writers: `cssColour` (`hex`, or `rgb(r g b / a)` from `hexChannels` of `design/tokens.mts`), `cssDimension` (`0` for a zero), `cssShadow` (no spread when it is zero), `cssTransition` (duration, keyword easing, a delay only when it is not zero), `cssTracking` (`0`, else `<n>em`), `fontStackOf` (quotes each family that is not a CSS generic family). `dtcgProblems(tree)`: a token with no `$type`, a name with `.`, `{`, `}` or a leading `$`, and a broken reference. Each problem names the token path. |
| `lib/design/style-dictionary.mts`                                                         | new           | Hooks: the name transform (`systemName`), one value transform per `$type`, and the tracking transform (`type.*.tracking`). Format `kinscape/css`: the one-line header, then each token outside `map` and the `MAP_SHARED` tokens, in file order. A reference becomes `var(--name)`. Format `kinscape/tokens-json`: the old tree, with a reference as text, a font as a stack, a `map` number as a number, each other value as its CSS text, and `notes` from `$description`. It names no file path.                      |
| `lib/design/css.mts`                                                                      | changed       | Export `fontStack` and `MAP_SHARED`. Delete `renderCss`, `cssVariables` and `GENERATED_HEADER` (D2). Line 1 comment names the new source.                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts/tokens.mts`                                                                      | changed       | `generate(root)` is async. It reads `design/kinscape.tokens.json`, runs `dtcgProblems` and throws on a problem. It returns `{ 'app/tokens.css', 'design/tokens.json' }` from `formatPlatform`. `run` writes both files.                                                                                                                                                                                                                                                                                                  |
| `app/tokens.css`                                                                          | changed       | Line 1: `/* Generated from design/kinscape.tokens.json by \`npm run tokens\`. Do not edit. */`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `design/tokens.json`                                                                      | changed       | The generated output (D1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `.prettierignore`                                                                         | changed       | Add `design/tokens.json` under `# Written by npm run tokens`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `lib/design/__tests__/dtcg.test.ts`                                                       | new           | Each writer on its edge values. Each problem kind, named by token path.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lib/design/__tests__/style-dictionary.test.ts`                                           | new           | Both formats on a small tree. The `cssVariables` cases move here with their `// PIN-06` tag.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lib/design/__tests__/tokens.test.ts`                                                     | changed       | Delete the `cssVariables` and `renderCss` tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `lib/design/__tests__/design.test.ts`                                                     | changed       | The stale test is async. It checks both files and names the stale file. A new test runs `dtcgProblems` on the real file and expects `[]`.                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/design/__tests__/tokens-page.test.ts`                                                | changed       | A test: `patternsFor` on a body that cites `design/kinscape.tokens.json` lists `design/topics/tokens.md`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts/__tests__/tokens.test.ts`                                                        | changed       | The fixture writes `design/kinscape.tokens.json`. The tests await `generate`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `design/topics/tokens.md`                                                                 | changed       | Frontmatter adds `design/kinscape.tokens.json`. The source, the CSS and Change a value name the new file. They say that the build writes `design/tokens.json`.                                                                                                                                                                                                                                                                                                                                                           |
| `docs/architecture.md`                                                                    | changed       | Rows "Design checks and token tooling", "A colour, size or font value" and "Tokens are the one source" name the new file and `lib/design/dtcg.mts`.                                                                                                                                                                                                                                                                                                                                                                      |
| `design/CANVAS.md`                                                                        | changed       | **When** names `design/kinscape.tokens.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `AGENTS.md`                                                                               | changed       | Hand-back row. The token line names `design/kinscape.tokens.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | The design system steps write these.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Order of work

1. Add the dependency. Write the tests for `dtcg.mts` and `style-dictionary.mts`, and see them fail.
2. Write `dtcg.mts`, the hooks and `scripts/tokens.mts`. Delete the old writer.
3. Convert the file with the throwaway script (D3). Run `npm run tokens`. Compare both outputs with `main` (acceptance checks 1 and 2).
4. Edit the docs. The tech lead edits `AGENTS.md` in a local session (hand-back).
5. Run the checks in `AGENTS.md` › Commands.
6. Run the design system steps 2 to 6. No board shows the change, so step 7 does not run. A local Claude Code session that the tech lead starts runs steps 3 to 5. It needs a signed-in account.
7. Put the sha256 lists and the diffs of `design-system.json` and `components/bundle.css` in the PR Evidence.

## Risks

- **Token order.** The CSS order must match `main`. Style Dictionary keeps the object order of the parsed file, and acceptance check 1 proves it.
- **Style Dictionary parses objects as composites.** Only the custom transforms run, so no built-in transform changes a value.
- **New package.** The `package.json` row names `style-dictionary` for the new-dependency check. The tech lead approves it in the PR.
- **Diff size.** The new file is over the cap. The tech lead adds `size: accepted` (D7 of the Spec) and `hand-back` (D8 of the Spec).

## Proof

| Acceptance check                                     | Proven by                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| 1. CSS lines after the first are the same            | `git diff main -- app/tokens.css` in Evidence: only line 1      |
| 2. `design/tokens.json` equals `main` as parsed JSON | A one-off `node` deep-equal in Evidence                         |
| 3. Only two design system files differ               | sha256 lists in Evidence                                        |
| 4. `design-system.json` differs only in the stamps   | Diff in Evidence                                                |
| 5. `components/bundle.css` differs only on line 1    | Diff in Evidence                                                |
| 6. A stale output fails and names the file           | `design.test.ts` stale test; `scripts/__tests__/tokens.test.ts` |
| 7. A DTCG problem fails and names the token          | `dtcg.test.ts`; `design.test.ts` real-file test                 |
| 8. Letter spacing writes `0` or `em`                 | `dtcg.test.ts` `cssTracking`; check 1                           |
| 9. `plan:new` lists `design/topics/tokens.md`        | `tokens-page.test.ts`                                           |
| 10. `AGENTS.md` names only `kinscape.tokens.json`    | `git grep "tokens.json" AGENTS.md` in Evidence                  |
| 11. The checks pass                                  | Output in Evidence                                              |
| 12. Design system steps 2 to 6                       | Commits on the branch                                           |
| 13. Canvas copy matches                              | sha256 compare in Evidence                                      |

## Out of scope

- The readers of `design/tokens.json`: SC.4, SC.4.1 and SC.4.2.
- `lib/design/notes.mts` reads the generated file until SC.4.2.

## Deviations

- One value transform, `kinscape/css-text`, switches on `$type` through `cssText`. The plan named one transform per type (929f27f).
- `dtcgProblems` does not check a leading `$`: the walk reads a `$` key as a DTCG property, not a name (929f27f).
- `buildTokens` takes the output paths. `scripts/tokens.mts` holds them as `OUTPUTS` (929f27f).
- The JSON format writes `notes` in file order. The design system bundle embeds `design/tokens.json`, so a new key order changed `bundle.js` (b5494aa).
- `design/kinscape.tokens.json` has 2,609 lines, not about 1,300 (929f27f).
