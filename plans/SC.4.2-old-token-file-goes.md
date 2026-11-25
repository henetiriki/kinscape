# Plan: SC.4.2: The old token file goes, and checks, scripts and docs read the standard file

- **Spec:** #1196
- **Requirement IDs:** None. This Spec changes tooling and docs only.
- **Status:** approved

## Approach

Each remaining reader of `design/tokens.json` moves to one of two sources:

- `.mts` code and its tests parse `design/kinscape.tokens.json` and read it with the DTCG readers that SC.4.1 added (`tokenLeaves`, `tokenText`, `resolvedText`). Lint stops a `.mts` value import of a `.ts` file.
- `.ts` tests and e2e specs import `design/tokens.generated.ts`, which holds the same resolved values in the old group shape.

The literal and size checks read token text with `tokenText`, so a reference stays `{path}` as on `main`, and no check result changes (D1). The TypeScript writer puts each token's Style Dictionary value in the tree, in place of `resolveTokens(oldTree)`. The writer also adds `hatchLine`, the stripe colour as `rgba()` text (Spec D3). The five helpers of `design/tokens.mts` move: `REFERENCE`, `referenceIn` and `isTree` to `lib/design/dtcg.mts`, and `HEX_COLOUR` and `hexChannels` to `lib/design/css.mts`. `css.mts` imports nothing, so `dtcg.mts` and `contrast.mts` can import it with no cycle. Then the JSON writer, `design/tokens.json`, `design/tokens.mts` and its test go.

## Decisions

**D1 · The tree that the literal and size checks take** · Decides: Tech lead

`Rule.pick`, `tokenLiterals`, `sizesIn` and `strayColours` take the old `Tree`. The fixtures of `literals.test.ts` and `sizes.test.ts` are old trees of about 20 lines each.

- **A.** These take a `DtcgTree`. `pick` returns the `tokenText` of each token in its group, and `leaves` in `groups.mts` goes. The two fixtures take the DTCG shape, with the builders of `dtcg-fixtures.ts`. Cost: about 90 lines.
- **B.** `dtcg.mts` adds `textTree`, which writes the DTCG tree in the old shape. Each caller converts once, and the checks and fixtures keep `Tree`. Cost: about 25 lines, and a Deviations line, because `Rule` then reads the standard file only through the converter.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Tool settings that name the generated module** · Decides: Tech lead

The page test matches a quoted string that ends in the token file. `eslint.config.mjs` and `knip.ts` name `design/tokens.generated.ts` in their ignore lists, so the new test counts them as readers.

- **A.** `design/topics/tokens.md` names both under a new bullet, "Tool settings that skip the generated file". Cost: 3 lines.
- **B.** The test skips the files at the repo root. Cost: 5 lines and a test case. A new root script that reads the file is then not caught.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The line cap** · Decides: Tech lead

The cap in `scripts/pr-checks.mts` is 660 lines. The deletion of the generated `design/tokens.json` is 733 lines. With `design/tokens.mts`, its test and the code, the diff is about 1,450 lines. The Spec estimate (about 700) left out the deleted files.

- **A.** One PR. The tech lead adds the `size: accepted` label. The 865 deleted lines need no review.
- **B.** Split the Spec. SC.4.2 moves the readers. A new Spec deletes the JSON writer, the two files and the test. Cost: a new Spec and a second plan.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The group-note rule of `dtcgProblems`** · Decides: Tech lead

`dtcgProblems` rejects a group note above a token note. Its comment gives the reason: the `notes` tree of `design/tokens.json` holds one text at each path. `notesOf` keys a note by its path, so that reason goes with the file.

- **A.** Keep the rule. The comment says that `noteProblems` reads one note for each token or `type` style. Cost: 1 line.
- **B.** Delete the rule and its test. Cost: about 15 lines. `noteProblems` still names a group note where none is needed.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                               | New / changed | What                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/design/dtcg.mts`                                                                                                              | changed       | Add `REFERENCE`, `referenceIn`, `isTree` (`value is DtcgTree`). Import `hexChannels` from `css.mts`. D4 comment.                                                                                       |
| `lib/design/css.mts`                                                                                                               | changed       | Add `HEX_COLOUR` and `hexChannels`. `strayColours` takes a `DtcgTree`.                                                                                                                                 |
| `lib/design/contrast.mts`, `notes.mts`, `system.mts`                                                                               | changed       | Import the helpers from their new modules.                                                                                                                                                             |
| `lib/design/types.ts`                                                                                                              | changed       | `Rule.pick` takes a `DtcgTree` and returns `string[]` (D1).                                                                                                                                            |
| `lib/design/groups.mts`                                                                                                            | changed       | `pick` reads `tokenLeaves` and `tokenText`. `field` reads one key of each `type` style.                                                                                                                |
| `lib/design/literals.mts`, `lib/design/sizes.mts`                                                                                  | changed       | Take a `DtcgTree`.                                                                                                                                                                                     |
| `lib/design/style-dictionary.mts`                                                                                                  | changed       | Drop the JSON format, `collectNotes` and `oldValue` for references. The TypeScript writer puts each resolved `$value` in the tree, and adds `hatchLine`. Line 1 names two outputs.                     |
| `scripts/tokens.mts`                                                                                                               | changed       | `OUTPUTS` drops `json`.                                                                                                                                                                                |
| `lib/ui/hatch.ts`                                                                                                                  | changed       | `HATCH_LINE = hatchLine` from `design/tokens.generated.ts`.                                                                                                                                            |
| `design/tokens.generated.ts`                                                                                                       | changed       | `npm run tokens` adds `hatchLine`. Nothing else changes.                                                                                                                                               |
| `scripts/sizes.mts`, `scripts/workflows-diagram.mts`, `scripts/design-export.mts`                                                  | changed       | Parse `design/kinscape.tokens.json`. The diagram reads each colour with `resolvedText`. The export message says `is not in design/kinscape.tokens.json`.                                               |
| `design/tokens.json`, `design/tokens.mts`, `design/__tests__/tokens.test.ts`                                                       | deleted       | `git rm`.                                                                                                                                                                                              |
| `lib/design/__tests__/dtcg.test.ts`                                                                                                | changed       | Tests of `referenceIn` and `isTree`. The line 218 comment names the DTCG file.                                                                                                                         |
| `lib/design/__tests__/tokens.test.ts`                                                                                              | changed       | The `hexChannels` test moves here. The `strayColours` fixture takes the DTCG shape.                                                                                                                    |
| `lib/design/__tests__/style-dictionary.test.ts`                                                                                    | changed       | Drop the JSON tests. Add a reference resolved by Style Dictionary and the `hatchLine` export, with and without `map.hatch`.                                                                            |
| `lib/design/__tests__/design.test.ts`                                                                                              | changed       | The layout, type, map and polity tests read the generated module. The snapshot test passes the parsed DTCG file to `strayColours`. "Holds the resolved value" compares each token with `resolvedText`. |
| `lib/design/__tests__/literals.test.ts`, `sizes.test.ts`                                                                           | changed       | DTCG fixtures (D1). The real-file case parses `design/kinscape.tokens.json`.                                                                                                                           |
| `lib/design/__tests__/tokens-page.test.ts`                                                                                         | changed       | Match a quoted string that ends in `design/kinscape.tokens.json` or `design/tokens.generated.ts`.                                                                                                      |
| `scripts/__tests__/sizes.test.ts`, `tokens.test.ts`, `workflows-diagram.test.ts`, `design-export.test.ts`                          | changed       | Fixtures and message text name the DTCG file. `tokens.test.ts` checks two outputs.                                                                                                                     |
| `scripts/__tests__/vercel-ignore.test.ts`, `layers.test.ts`, `layers-config.test.ts`, `vercel-imports.test.ts`, `plan-new.test.ts` | changed       | Name `design/tokens.generated.ts` or `design/kinscape.tokens.json`.                                                                                                                                    |
| `e2e/design.spec.ts`, `e2e/gallery-looks.spec.ts`                                                                                  | changed       | Import `colour` and `map` from the generated module.                                                                                                                                                   |
| `e2e/design-export.spec.mts`                                                                                                       | changed       | `tokenColours` reads `design/kinscape.tokens.json`.                                                                                                                                                    |
| `.prettierignore`                                                                                                                  | changed       | Drop `design/tokens.json`.                                                                                                                                                                             |
| `design/topics/tokens.md`                                                                                                          | changed       | `paths:` drops two files. The CSS names two outputs. Direct readers: the DTCG file or the generated module, plus `scripts/design-system.mts` and D2.                                                   |
| `design/topics/foundations.md`, `design/topics/layout.md`                                                                          | changed       | Name `design/kinscape.tokens.json` and `$description` in place of `tokens.json` and `notes`.                                                                                                           |
| `docs/architecture.md`                                                                                                             | changed       | Line 19 drops `resolveTokens`. Line 32 drops `design/tokens.mts` and `design/tokens.json`.                                                                                                             |
| `.claude/skills/match-design/SKILL.md`, `.claude/skills/publish-design-system/SKILL.md`                                            | changed       | Name `design/kinscape.tokens.json`.                                                                                                                                                                    |

## Order of work

1. Move the five helpers and their tests. Point each import at the new module.
2. Move `Rule`, `groups.mts`, `literals.mts`, `sizes.mts`, `strayColours` and their fixtures (D1). Run `npm run sizes`. `off-token-sizes.json` must not change.
3. Move the TypeScript writer and add `hatchLine`. Run `npm run tokens`. Then point `lib/ui/hatch.ts` at it.
4. Move the scripts, `design.test.ts`, the script tests and the e2e specs.
5. Drop the JSON writer. `git rm` the three files. Edit the fixture tests that name them.
6. Edit the page test, the docs and the skills.
7. Run the [design system steps](../design/CANVAS.md#changing-the-design-system) 2 to 6, because `foundations.md` and `layout.md` are in `DESIGN_FILES`. The tech lead runs steps 3 to 5, or a local Claude Code session that the tech lead starts runs them. The session needs a signed-in account. The CI build asks for them in the PR and keeps the PR as a draft. No board shows the change.

## Risks

- **Colour sets.** `tokenColours` and `strayColours` read the text of the DTCG file. No `$description` holds a colour on `main`. Before step 5, the build compares the colour sets of the two files once and puts the result in the PR Evidence.
- **Generated module.** Style Dictionary resolves a `map` number reference to text. The writer keeps a `map` number as a number. `design.test.ts` fails if `design/tokens.generated.ts` changes in any line except `hatchLine`.

## Proof

| Acceptance check                        | Proven by                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1, 2. No old file name outside `plans/` | PR Evidence: `git grep "design/tokens.json" -- ":!plans/"` and the same for `design/tokens.mts` print nothing |
| 3. Two outputs only                     | `scripts/__tests__/tokens.test.ts`: `OUTPUTS` has two keys, and `run` writes only those files                 |
| 4. The hatch text                       | `style-dictionary.test.ts` (`hatchLine`); `Legend.test.tsx` (`HATCH_LINE` is `rgba(139, 74, 28, 0.34)`)       |
| 5. A reader that the page does not name | `tokens-page.test.ts`: a synthetic reader of each file is named                                               |
| 6. A token literal still fails          | `literals.test.ts` cases on the DTCG fixture                                                                  |
| 7. A new off-token size still fails     | `sizes.test.ts` cases on the DTCG fixture; `off-token-sizes.json` unchanged                                   |
| 8. The export and the design check pass | The `design` and `gallery` CI jobs                                                                            |
| 9. The checks pass                      | The output of each command in AGENTS.md › Commands                                                            |
| 10. Steps 2 to 6                        | PR Evidence: the step 2 output and the tech lead's run of steps 3 to 5                                        |
| 11. Canvas copy sha256                  | PR Evidence: the sha256 lists of step 5                                                                       |

## Out of scope

- `Tree` in `design/types.ts` stays for `bundle.mts` and the internals of `style-dictionary.mts`.
- The design system's own `tokens.json` and `scripts/tokens.mts` keep their names (Spec D4).
- Scale settings: SC.5. Breakpoints as a list: SC.6.

## Deviations

- `lib/design/__tests__/dtcg-fixtures.ts` gains builders (`num`, `weight`, `press`, `ms`, `layer`, `shadowOf`) for the DTCG fixtures of D1.
- `design.test.ts` also compares `hatchLine` with `rgba(139, 74, 28, 0.34)`.
- The runner denied edits to `.claude/skills/*/SKILL.md`. The two skill rows are not built: a person edits them.
- Steps 3 to 5 of the design system steps need a signed-in session. They are not done.
