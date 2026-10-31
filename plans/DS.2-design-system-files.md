# Plan: DS.2: Generate the design system's files from the repo

- **Spec:** #445
- **Requirement IDs:** NFR-03, NFR-06
- **Status:** approved

## Approach

Pure functions in `lib/design/system.mts` turn `tokens.json`, `DESIGN.md` and the font list into the type's files. `scripts/design-system.mts` does the I/O: it empties the output folder, writes those files, and copies the fonts and SVGs. Names come from `cssName` without `--`. Values come from `tokens.json` as written, and a `{group.path}` reference becomes `{cssName}`. The font list is read from the `src` literals in `app/layout.tsx` (path, style, weight). A file's family is the `tokens.json` font whose slug starts its file name, and its `unicode-range` comes from the package's own CSS. `formatProblems` (`lib/design/format.mts`) names each token that breaks a **Type format** rule. Timestamps are HEAD's commit time in UTC.

## Decisions

**D1 · Output folder** · Decides: Tech lead

- **A.** `.design-system/project/`, ignored. ESLint, Prettier and Vitest skip dot-folders.
- **B.** `design-system/project/`; each tool needs an ignore entry.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Type groups** · Decides: Tech lead

- **A.** One group per font key (`Display`, `Body`, `Mono`), with the styles in `tokens.json` order. A group's `family` is its key.
- **B.** Role groups (Headings, Text, Controls, Mono).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Font notes** · Decides: Tech lead

`type.families` has no `usage`, so the three `notes.font` notes can't be carried.

- **A.** Leave them out. The README's Fonts section says the same. Acceptance check 1 gets "except font stacks".
- **B.** Also a `font` family. Its `--font-<key>` clashes with the families', and `'` isn't allowed.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Values the digest leaves open** · Decides: Tech lead

The digest names `assetGroups.<g>.tile`, `lastChange.by` and `lastChange.via` but not their values.

- **A.** Add the values to the Spec's **Type format**.
- **B.** Leave `tile` out; `by` `"KinScape repo"`, `via` `"code"`, `note` `"npm run design-system at <sha7>"`. DS.3 corrects them.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · Cover** · Decides: Tech lead

Four blocks in `brand`, `map-land`, `map-sea` and `pin`, with `radius-panel` corners, staggered by `space-*` steps right of x = 480. The tagline is "Borders move. Places don't." (`DESIGN.md` › Brand), set in `ink-3`.

- **A.** Pattern: dashed Polity-border lines (`map.border` dash 4/2.6) crossing the blocks, as in the tagline.
- **B.** Pattern: the 45° contested hatch (`lib/ui/hatch.ts`).
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                                                                                 |
| ----------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `lib/design/system.mts`                   | New           | `systemTokens`, `systemCss`, `readme` (sections; non-`https` links → their text), `systemIndex`, `fontFaces`         |
| `lib/design/format.mts`                   | New           | `formatProblems`                                                                                                     |
| `lib/design/cover.html`                   | New           | Static cover; classes bind to `var(--…)` from `../../tokens.css`                                                     |
| `lib/design/__tests__/system.test.ts`     | New           | Real file: values equal `resolveTokens`, notes carried; README sections, no relative links; cover rules              |
| `lib/design/__tests__/format.test.ts`     | New           | Each rule fails, naming the token; real output gives `[]`                                                            |
| `scripts/design-system.mts`               | New           | `run(root, out)`                                                                                                     |
| `scripts/__tests__/design-system.test.ts` | New           | Two runs into temp folders are byte-identical; listed fonts and icons exist; no `manifest.json`, `api/` or dot-files |
| `package.json`, `.gitignore`              | Changed       | `design-system` script; the D1 folder                                                                                |

## Order of work

1. `format.test.ts` fails on the behaviour (rule 12), then `format.mts`.
2. `system.test.ts` fails, then `system.mts`.
3. Script test fails, then the script and `cover.html`.
4. Run it; `git status --porcelain`, `git check-ignore`, then the checks.

## Deviations

- `system.mts` also exports `fontFiles`, `systemFonts`, `unicodeRange`; types in `lib/design/types.ts`.
- `system.test.ts` and the script test came after their code; rule 12's failing line is for `format.test.ts` only.

## Risks

- **latin-ext shadows latin.** A reader that builds `@font-face` from `type.fonts` without `unicode-range` could pick the wrong file. Our `tokens.css` carries the range.
- **`../../tokens.css` in the cover.** If wrong, DS.3's publish shows unstyled blocks.

## Proof

| Acceptance check                       | Proven by                                                      |
| -------------------------------------- | -------------------------------------------------------------- |
| Values equal `tokens.json`, with notes | `system.test.ts`                                               |
| Names, colours and aliases pass        | `format.test.ts`                                               |
| Fonts and icons present                | `design-system.test.ts`                                        |
| README sections, no repo links         | `system.test.ts`                                               |
| Byte-identical runs                    | `design-system.test.ts`                                        |
| Checks pass; output untracked          | Output, `git status` and `git check-ignore` pasted in Evidence |
