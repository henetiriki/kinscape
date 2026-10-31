# Plan: DS.1: A usage note for every design-system token

- **Spec:** #444
- **Requirement IDs:** NFR-06
- **Status:** draft

## Approach

Add a top-level `notes` group to `design/tokens.json` mirroring the token paths (Spec D1: A), written from `DESIGN.md` and how components use each token. `type` gets one note per style. In `map`, a token needs a note when its resolved value is a colour (`coloursIn` finds one), so `hillshade.exaggeration` and the widths and opacities need none. `noteProblems(tokens)` in `lib/design/notes.mts`, where DS.2 can reuse it, returns one message per problem: a missing or empty note, a note naming no token that needs one (D1), and a note containing its token's value. `cssVariables` skips `notes`, so `app/tokens.css` stays the same. The other readers that walk every group (`resolveTokens`, `strayColours`, `tokenColours` in `scripts/design-export.mts`) pass note text through or find no colour in it. The Colours "Used for" table in `DESIGN.md` becomes one pointer line, and the NFR-06 contrast paragraph stays.

## Decisions

**D1 · Which notes fail as naming no token** · Decides: Tech lead

- **A.** Any note whose path isn't a token that needs one: a misspelt path, and also a note on an excluded token (`notes.layout.dock-left`, `notes.map.border.width`).
- **B.** Only a path that matches no token at all, as the Spec words it. A note on an excluded token passes.
- **Other:** your own.

Recommended: A, because otherwise nothing keeps notes out of the excluded groups. Neither changes the Spec text.

**D2 · Polity fills** · Decides: Tech lead

- **A.** One note per `map.polity.*` tint, as the Spec says (e.g. "Fill for the Natal Polity.").
- **B.** One note on `notes.map.polity`, like a `type` style. This rewords the Spec's `map` bullet.
- **Other:** your own.

Recommended: A, because DS.2 publishes each tint as its own swatch, and each swatch needs a note.

## Files that change

| File                                  | New / changed | What                                                                                                    |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `lib/design/notes.mts`                | New           | `noteProblems(tokens)`                                                                                  |
| `lib/design/__tests__/notes.test.ts`  | New           | Synthetic tokens: missing, empty, unknown and value-repeating notes, each named; `type` and `map` rules |
| `lib/design/css.mts`                  | Changed       | `cssVariables` skips `notes`                                                                            |
| `lib/design/__tests__/tokens.test.ts` | Changed       | Adds a `notes` group to the `cssVariables` fixture; the expected output is unchanged                    |
| `lib/design/__tests__/design.test.ts` | Changed       | `noteProblems` of the real `tokens.json` is `[]`                                                        |
| `design/tokens.json`                  | Changed       | The `notes` group                                                                                       |
| `design/DESIGN.md`                    | Changed       | Colours: the table becomes one line pointing to `notes`                                                 |
| `docs/architecture.md`                | Changed       | "A colour, size or font value" row: add its note                                                        |

## Order of work

1. `notes.test.ts`: see it fail on the behaviour, then write `notes.mts` (rule 12).
2. Add `notes` to the `css` fixture: see `--notes-…` appear, then skip the group in `cssVariables`.
3. Add the real-file test: see it fail naming every token, then write the notes.
4. `DESIGN.md` and `architecture.md`. Run `npm run tokens` and check that `git diff origin/main -- app/tokens.css` is empty.
5. Lint, `format:check`, `words`, tests, `validate:boundaries`, `e2e`, `design:check`.

## Risks

- **A reader shows note text as a token.** Only `cssVariables` emits a value per path. Its fixture keeps a `notes` group, so a regression fails.
- **A note adds a colour to the stray-colour scans.** A note repeating its value fails; review catches any other.

## Proof

| Acceptance check                                   | Proven by                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Every token has a note; a missing one fails, named | `notes.test.ts` (synthetic token with no note); `design.test.ts` (real file)                   |
| A note for no token fails, named                   | `notes.test.ts`                                                                                |
| `app/tokens.css` byte-identical to `main`          | `design.test.ts` "up to date" test; empty `git diff origin/main -- app/tokens.css` in Evidence |
| "Used for" table → pointer; each usage in a note   | The diff; the PR body maps each removed row to its notes                                       |
| lint, format, words, tests, e2e, design check pass | Output pasted in Evidence                                                                      |

## Out of scope

Everything the Spec lists under _Out of scope_. The overlapping usages in › Fonts and › Shape and depth stay (Spec › Flagged concerns).
