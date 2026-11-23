# Plan: SC.2: A size check stops new sizes that are off the tokens

- **Spec:** #1192
- **Requirement IDs:** None. The Spec changes tooling only.
- **Status:** draft

## Approach

A new dev-only module, `lib/design/sizes.mts`, reads each size in CSS and in inline `style` props. It gives each size its file, line, property and value. It shares one property-to-group table with `lib/design/literals.mts`, so the two checks cannot disagree on a group. The table gains `@media` lengths (`breakpoint`) and `outline-width` and `outline-offset` (`focus`). A size passes if it is a pass form of the Spec, equals a token of its group, or has an `own:` comment on its line. Each other size must match an entry of `lib/design/off-token-sizes.json`.

`npm run sizes` (`scripts/sizes.mts`) writes the list from the code. A new test fails on a size with no entry and on an entry with no size. The literals test uses the same reader, so an `own:` comment passes on a line with any size.

The reader parses CSS with the declaration scan that `literals.mts` uses today. It parses TSX with the TypeScript compiler API (`ts.createSourceFile`), and reads only the `style` attribute. Thus, SVG attributes such as `width`, `r` and `strokeWidth` are never read. A React number on a length property is a px value. On `opacity`, `zIndex`, `fontWeight` and `lineHeight`, React reads the number with no unit.

What the reader takes from each kind of property:

- `transition` and `animation`: only durations. An easing function holds no size.
- `transform`: only the lengths in `translate*()`. Angles and `scale()` factors are not offsets.
- `box-shadow` and `text-shadow`: no size if the whole value equals a `shadow` token. Otherwise, each length that is not zero.
- `@media`: each length in the condition, with the property `@media`.

The test files are `lib/design/__tests__/sizes.test.ts` (fixtures and the repo) and the changed `literals.test.ts`.

## Decisions

**D4 · A `style` value that is not a literal** · Decides: Tech lead

Some inline styles use an expression: `style={mark(...)}` and `style={hatchStyle}` in `features/map/components/DateSlider.tsx`, and `left: spots[index].x` in `PinFan.tsx`. The Spec says "each inline `style` prop", but a check cannot know an expression's value with no run.

- **A.** Read each string or number literal in an object literal of the prop. Skip identifiers, calls and template literals with an expression. The tokens page says so. Cost: none more.
- **B.** As A, and follow a `const` in the same file that holds an object literal (`hatchStyle`). Cost: about 40 more lines and a scope walk.
- **C.** Fail on any `style` prop that is not an object literal of literals. Cost: the build rewrites four components, which the Spec does not ask for.

Recommended: A, because a value that a function computes is not a hand-typed size, and the check targets hand-typed sizes. B also catches a `const` style object, but no such object holds a literal size on `main`.

**D5 · Two copies of one size in one file** · Decides: Tech lead

The Spec makes an entry "file, property and value", with no line. A file can hold the same property and value twice, for example `height: 36px` in `features/map/components/CountMarker.module.css`. With one entry per triple, a new copy of a listed size passes, and a fix of one copy of two leaves the entry in force.

- **A.** One entry for each distinct triple, as the Spec says. Cost: none more.
- **B.** Each entry also holds a `count`. The test fails when the code has more or fewer copies than the count. Cost: about 15 more lines; this changes the Behaviour line "A list entry is file, property and value".

Recommended: B, because the Summary says no new off-token size gets in, and A lets a copy in. A loses only the copy case, which is rare in one file.

**D6 · A custom property that holds a size** · Decides: Tech lead

Four custom properties hold a literal size on `main`, for example `--gap: 5px` in `features/map/components/CountMarker.module.css` and `--thumb: 26px` in `DateSlider.module.css`. The Spec lists no custom property in "It reads each kind of measurement". SC.9.1 (#1202) makes a local custom property the one place for an off-scale size.

- **A.** Read a custom property whose value holds a length as a size, with no group. It passes with an `own:` comment or an entry. Cost: about 10 lines; four entries on the list.
- **B.** Skip custom properties. Cost: none; a new off-token size can enter through `--x: 7px` and `var(--x)`.

Recommended: A, because B leaves a path round the check, and SC.9.1 checks the same properties next.

## Alternatives considered

- A Stylelint rule in place of a Vitest test: it adds a dependency, it cannot read TSX `style` props, and the literals test already holds the group table.
- A line number in each entry: the Spec rules it out, because an edit above a size would change the list.

## Files that change

| File                                    | New / changed | What                                                                                                                                                        |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/sizes.mts`                  | New           | Reads each size of a CSS or TSX text with its line, property, value and status. Compares sizes with the list.                                               |
| `lib/design/literals.mts`               | Changed       | Exports the group table with the two new groups, for `sizes.mts`. An `own:` comment passes on a line with any size. The message says "a line with no size". |
| `lib/design/types.ts`                   | Changed       | `Size` and `SizeEntry` types.                                                                                                                               |
| `lib/design/off-token-sizes.json`       | New           | The list, sorted by file, property and value. `npm run sizes` writes it.                                                                                    |
| `scripts/sizes.mts`                     | New           | Reads each tracked file (`git ls-files`), then writes the list.                                                                                             |
| `package.json`                          | Changed       | `"sizes": "node scripts/sizes.mts"`.                                                                                                                        |
| `lib/design/__tests__/sizes.test.ts`    | New           | Each acceptance check on fixtures, then each tracked file against the list.                                                                                 |
| `lib/design/__tests__/literals.test.ts` | Changed       | `gap: 7px; /* own: odd */` now passes. A new case: an `own:` comment on a line with no size still fails. `outline-offset: 2px` fails as a `focus` literal.  |
| `scripts/__tests__/sizes.test.ts`       | New           | The script writes the list that `sizes.mts` gives for a fixture tree.                                                                                       |
| `design/topics/tokens.md`               | Changed       | Part "The size check" after "The checks": what passes, how to add an `own:` reason, and `npm run sizes`. "The checks" names the new test.                   |
| `docs/architecture.md`                  | Changed       | The "Tokens are the one source" row adds `lib/design/sizes.mts` to _Where_ and `lib/design/__tests__/sizes.test.ts` to _Enforced by_ (pattern-table rule).  |
| `scripts/word-count.mts`                | Changed       | Raise the `design/topics/tokens.md` budget if the new part goes over 500 words.                                                                             |

## Order of work

1. Write `sizes.test.ts` with fixture cases for each acceptance check. Run it and see it fail.
2. Move the group table in `literals.mts` to an export. Add the `breakpoint` and `focus` rules. Let a property match more than one rule, so `outline: 2px solid` gets `focus` and colour.
3. Write `sizes.mts`: the CSS reader, the `@media` reader, the TSX reader, the pass forms and the list compare.
4. Change the `own:` rule in `literals.mts` and its tests.
5. Write `scripts/sizes.mts` and its test. Run `npm run sizes` on `main`. Check that `git status` shows no CSS or TSX change.
6. Write the tokens page part and the architecture row.
7. Run the checks in `AGENTS.md` › Commands.

## Risks

- `docs/architecture.md` and the tokens page are close to their word budgets. Cut words in the same file, or raise the budget in `scripts/word-count.mts`.
- The list can hold some hundreds of entries. The script writes stable JSON with one key per line, so Prettier keeps it as it is and a diff shows each change.
- An open Spec (#884, #869) that adds a size fails the test. Its build adds an `own:` reason or runs `npm run sizes`. Review reads each new entry as for an `own:` reason.
- The TypeScript parse of about 125 `.tsx` files adds time to `npm test`. The reader parses only a file whose text holds `style=`.

## Proof

| Acceptance check                                                     | Proven by                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A `.module.css` size off the tokens fails and names file, line, etc. | `sizes.test.ts` fixture case                                                                                       |
| The same size in `app/globals.css` fails                             | `sizes.test.ts` fixture case with the path `app/globals.css`                                                       |
| The same size in an inline `style` prop fails                        | `sizes.test.ts` TSX fixture case                                                                                   |
| An opacity, border width or transform offset with no reason fails    | `sizes.test.ts`, one case each                                                                                     |
| An entry with no size in the code fails and names it                 | `sizes.test.ts` list case                                                                                          |
| On `main`, the written list passes, and no CSS or TSX file changes   | `sizes.test.ts` repo cases; `git status` after `npm run sizes`, in the PR                                          |
| A size with `/* own: <reason> */` passes                             | `sizes.test.ts` CSS and TSX cases                                                                                  |
| An `own:` comment on an off-token size passes the literals test      | `literals.test.ts`                                                                                                 |
| An `own:` comment on a line with no size fails the literals test     | `literals.test.ts`                                                                                                 |
| Each pass form of Behaviour passes                                   | `sizes.test.ts` `it.each` over `0`, `50%`, `1fr`, `auto`, `100dvh`, `* 1px`, a token value, `own:`, a listed value |
| An SVG attribute with a number is not read                           | `sizes.test.ts` TSX case with `<circle r={4} strokeWidth={1.5}>`                                                   |
| The tokens page has "The size check"                                 | `lib/design/__tests__/tokens-page.test.ts` new case                                                                |
| The checks in `AGENTS.md` › Commands pass                            | CI on the PR                                                                                                       |

## Out of scope

- Comparing rem with px: SC.7 (#1199).
- Local values with a listed reason in place of `own:`: SC.9.1 (#1202).
- The check with no list: SC.16 (#1210).

## Deviations
