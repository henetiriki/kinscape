# Plan: SC.4.1: The design-system export reads the standard token file

- **Spec:** #1195
- **Requirement IDs:** None. This Spec changes tooling only.
- **Status:** draft

## Approach

`scripts/design-system.mts` parses `design/kinscape.tokens.json` and gives the DTCG tree to `systemFonts`, `systemTokens`, `roleSentences`, `ratioOf` and `noteProblems`. A small set of DTCG readers in `lib/design/dtcg.mts` (D1) gives each module the same text that `design/tokens.json` holds today: a reference stays `{path}`, and any other value is its `cssText`. Thus the design system files stay byte-identical. The usage note of a `type` style is the `$description` of its style group, because no single token holds the style. `fontNames` gets the font stacks from the export's own `type.families` (D2). The export does not read `design/tokens.generated.ts`: lint stops a `.mts` value import of a `.ts` file (`MTS_TS_PATTERN` in `eslint.config.mjs`).

## Decisions

**D1 · Where the DTCG reads live** · Decides: Tech lead

Four modules need the same reads: the leaves, the text of a value, a resolved value and each `$description`. `collectNotes` in `lib/design/style-dictionary.mts` already walks each `$description`.

- **A.** `lib/design/dtcg.mts` exports `tokenLeaves`, `tokenText`, `resolvedText` and `descriptions`. The four modules use them, and `collectNotes` uses `descriptions`. Cost: about 60 lines with tests.
- **B.** Each module walks the DTCG tree itself. Cost: about the same lines, with three copies of the walk.
- **Other:** your own.

Recommended: A, because `docs/code-rules.md` keeps logic in one place.

**D2 · What `fontNames` reads** · Decides: Tech lead

`fontNames` in `lib/design/bundle.mts` takes the old `Tree` and reads `tokens.font`. `bundle.mts` is not in the Behaviour lists.

- **A.** `scripts/design-system.mts` calls `fontNames({ font: system.type.families })`. These are the same stacks in the same order. `bundle.mts` does not change.
- **B.** `fontNames` takes the DTCG tree. Cost: `bundle.mts` and the fixtures in `bundle.test.ts`, about 30 lines, and a Deviations line.
- **Other:** your own.

Recommended: A, because the export already holds the stacks, and the Spec keeps `bundle.mts` out.

**D3 · The message for a note that no token needs** · Decides: Tech lead

On `main`, `noteProblems` writes `notes.<path> names no token that needs a note`. The DTCG file has no `notes` group, so the prefix names nothing. Acceptance check 4 covers only a missing, empty or value-repeating note.

- **A.** The message becomes `<path>: a note where none is needed`. Cost: three expectations in `notes.test.ts`.
- **B.** Keep the `notes.` text.
- **Other:** your own.

Recommended: A, because a reader looks for a `notes` group that does not exist. B loses only that clarity.

## Alternatives considered

- Turn the DTCG file into the old `Tree` in `scripts/design-system.mts`: Spec D1 option C, not chosen.
- Read resolved values from `design/tokens.generated.ts`: lint blocks the import (Approach).

## Files that change

| File                                    | New / changed | What                                                                                                                                                                        |
| --------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                   | changed       | `DtcgTree`: a group of tokens and groups, with an optional `$description`. `Rule` keeps `Tree`.                                                                             |
| `lib/design/dtcg.mts`                   | changed       | `tokenLeaves`, `tokenText`, `resolvedText` and `descriptions` (D1). Each walks in file order.                                                                               |
| `lib/design/__tests__/dtcg.test.ts`     | changed       | A test for each new reader: a reference, a chain of references, a colour with alpha, a group `$description`.                                                                |
| `lib/design/style-dictionary.mts`       | changed       | `collectNotes` uses `descriptions` (D1). Its comment drops the claim that the bundle embeds `design/tokens.json`.                                                           |
| `lib/design/contrast.mts`               | changed       | `valueAt` and `ratioOf` take a `DtcgTree`. `valueAt` returns `resolvedText`.                                                                                                |
| `lib/design/roles.mts`                  | changed       | `roleSentences` takes a `DtcgTree`. Line 1 names `$description`.                                                                                                            |
| `lib/design/notes.mts`                  | changed       | `noteProblems` takes a `DtcgTree` and reads `descriptions`. D3 message. Line 1 names `design/kinscape.tokens.json`.                                                         |
| `lib/design/system.mts`                 | changed       | `systemFonts` and `systemTokens` take a `DtcgTree`. A usage note is the `$description`. Line 1 and the font error name `design/kinscape.tokens.json`.                       |
| `scripts/design-system.mts`             | changed       | Parse `design/kinscape.tokens.json`. Call `fontNames` as D2 says.                                                                                                           |
| `lib/design/__tests__/system.test.ts`   | changed       | Read `design/kinscape.tokens.json`. Build the expected list from `$description` and `resolvedText`. Add a token with no `$description` that stays out. New font error text. |
| `lib/design/__tests__/roles.test.ts`    | changed       | Read `design/kinscape.tokens.json`. "Every colour token has a role" reads the DTCG `colour` group.                                                                          |
| `lib/design/__tests__/contrast.test.ts` | changed       | Read `design/kinscape.tokens.json`. The `ratioOf` fixture takes the DTCG shape.                                                                                             |
| `lib/design/__tests__/notes.test.ts`    | changed       | The fixture takes the DTCG shape, with each note as a `$description`. The same cases and messages, except D3.                                                               |
| `lib/design/__tests__/design.test.ts`   | changed       | The `noteProblems` call takes the parsed `design/kinscape.tokens.json`. The rest stays for SC.4.2.                                                                          |
| `design/topics/tokens.md`               | changed       | The design system and the canvas: one sentence that `npm run design-system` reads `design/kinscape.tokens.json`.                                                            |

## Order of work

1. Add `DtcgTree` and the D1 readers, test first.
2. Move `contrast.mts` and `roles.mts`, with their tests.
3. Move `notes.mts`, the `notes.test.ts` fixture and the `design.test.ts` call.
4. Move `system.mts` and `system.test.ts`.
5. Move `scripts/design-system.mts`, and point `collectNotes` at `descriptions`.
6. Edit `design/topics/tokens.md`.
7. Run `npm run design-system` on `main` and on the branch. Put both sha256 lists of `.design-system/project/` and the diff of `design-system.json` in the PR Evidence.

No design system input changes, so the steps of `design/CANVAS.md` › Changing the design system do not run.

## Risks

- **Key order.** On `main`, the design system's `tokens.json` takes its order from Style Dictionary's `allTokens`. The D1 readers walk the file order. If the two differ, step 7 shows a diff. Then the readers take the order of `allTokens`.
- **A note on a group.** A `$description` on a group other than a `type` style reaches `noteProblems` as on `main`, and the check names it.

## Proof

| Acceptance check                               | Proven by                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1. Byte-identical apart from the two stamps    | PR Evidence: both sha256 lists, and the diff of `design-system.json` (step 7)                    |
| 2. A token with no `$description` stays out    | `system.test.ts`: a DTCG fixture token with no `$description` is not in `systemTokens`           |
| 3. A colour keeps its role and ratio           | PR Evidence: the same sha256 for `tokens.json`; `roles.test.ts`                                  |
| 4. The notes check gives the same messages     | `notes.test.ts`: the missing, empty and value-repeating cases keep their `main` messages         |
| 5. No module or listed test names the old file | PR Evidence: `git grep -n "design/tokens.json"` on the modules and the four tests prints nothing |
| 6. The checks pass                             | The output of each command in AGENTS.md › Commands                                               |

## Out of scope

- `Rule`, `groups.mts`, `literals.mts`, the other scripts, the checks, the e2e specs and the deletion of `design/tokens.json` and `design/tokens.mts`: SC.4.2 (#1196).
- The `design/tokens.json` comment in `dtcg.mts` and `dtcg.test.ts`: SC.4.2.

## Deviations
