# Plan: C1175: Fail a test on a CSS literal that equals a token value

- **Spec:** #1175
- **Requirement IDs:** None. This Chore changes tooling and CSS only.
- **Status:** draft

## Approach

A new module `lib/design/literals.mts` finds each token literal in the text of one `.module.css` file. A new test runs it on each tracked `.module.css` file and on fixtures. The module reads each declaration with its line, takes the group of its property (the table of issue step 1), and compares each value part with the token values of that group. It skips `0`, `var()`, each number in a `calc()` that holds a `var()`, and the `layout` group. A `motion` token gives its duration only, so `120ms` matches `120ms ease-out`. A colour compares by `coloursIn` of `css.mts`. A line passes if it carries `/* own: <reason> */`. The build then fixes the 59 literals of the list below and adds three tokens.

## Decisions

**D1 · When step 4 adds a token** · Decides: Tech lead

Issue step 4 adds a token when "two or more literals" share a value and a role. Step 5 says "a value that two parts share". In one part, the height and the width of a square, or the hover rule and its `data-state` copy, are two literals with one value and one role.

- **A.** Add a token only when two parts share the value and the role. The plan adds `--size-handle` and `--size-halo-hover`, and `--radius-bar` if D3 is A.
- **B.** Also add a token for each value that two literals of one part share. This adds seven more tokens: the Popup pointer (16px), CountMarker (36px, 40px), PinFan (36px, 40px, 44px) and DateSlider (8px).
- **Other:** your own.

Recommended: A, because a part's height and width are one own dimension, as step 3 says.

**D2 · Negative literals** · Decides: Tech lead

`margin-bottom: -4px` (BottomSheet) and `margin: -8px 0` (DateSlider) are the negative of a `space` token. PinPopup writes the same thing as `calc(-1 * var(--space-8))`.

- **A.** The test does not count a negative value: `-8px` does not equal `8px`. This matches the 6 `space` literals of issue step 3.
- **B.** The test counts a negative value as its token. The build fixes two more literals, and the issue's step 1 and count change.
- **Other:** your own.

Recommended: A, because issue step 2 says "equals", and both margins undo an own padding or box.

**D3 · The 2px radius of a 4px bar** · Decides: Tech lead

The BottomSheet handle and the DateSlider track are 4px bars with a 2px radius. Under step 4 they share a value and a role.

- **A.** Add `--radius-bar` (2px, "Round ends of a 4px bar: a sheet handle and the date slider track"). Use it on the two lines.
- **B.** Give each line an `own:` comment, because each radius follows from the bar's own height.
- **Other:** your own.

Recommended: A, because step 4 asks for a token when two parts share a value and a role.

## Files that change

| File                                                    | New / changed | What                                                                                                                                                  |
| ------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/literals.mts`                               | New           | `tokenLiterals(css, tokens)`: the problems of one file, each with its line and text                                                                   |
| `lib/design/types.ts`                                   | Changed       | The `LiteralProblem` type                                                                                                                             |
| `lib/design/__tests__/literals.test.ts`                 | New           | Fixtures for each case of step 2 and each skipped form; each tracked `.module.css` file has no problem                                                |
| `design/tokens.json`                                    | Changed       | `size.handle` (40px), `size.halo-hover` (52px), `radius.bar` (2px, if D3 is A), with notes                                                            |
| `app/tokens.css`                                        | Changed       | `npm run tokens`                                                                                                                                      |
| The 20 `.module.css` files of the list                  | Changed       | One edit for each literal                                                                                                                             |
| `docs/architecture.md`                                  | Changed       | The row text and the _Enforced by_ cell of steps 5 and 6. The cell names `lib/design/__tests__/literals.test.ts` in place of "the test of this Chore" |
| `design/canvas/project/ds/**`, `canvas.json`, `VERSION` | Changed       | Design system steps 3 to 5                                                                                                                            |

New token notes: `handle` "Width of the drag handle of a sheet, a Dialog and a popup on a phone." `halo-hover` "Halo of a hovered count marker or fan Pin."

## Literals

Paths are short: `app/components/<role>/` or `features/map/components/`. The test finds each line on `main` at `c1a35703`.

**Existing token (6).**

| File: line       | Value  | Choice                                                   |
| ---------------- | ------ | -------------------------------------------------------- |
| `Chip`: 103      | 30px   | `--size-chip-s`                                          |
| `Chip`: 122, 126 | 26px   | `--size-chip-remove`                                     |
| `Toast`: 33      | 36px   | `--size-control-xs`: the action is an extra-small button |
| `Menu`: 88       | 52px   | `--size-row-l`: a row with detail is a tall row          |
| `PinPopup`: 87   | 12.5px | `--type-caption-size`: the note is a footnote            |

**New token (15).**

| File: line                                                                | Value | Choice              |
| ------------------------------------------------------------------------- | ----- | ------------------- |
| `BottomSheet`: 51; `Dialog`: 71; `PinPopup`: 30; `Popup`: 27; `Sheet`: 59 | 40px  | `--size-handle`     |
| `CountMarker`: 52, 53, 64, 65; `PinFan`: 97, 98, 109, 110                 | 52px  | `--size-halo-hover` |
| `BottomSheet`: 49; `DateSlider`: 16                                       | 2px   | `--radius-bar` (D3) |

**`own:` (38).** The token column gives the token of the same value.

| File: line                    | Value | Token               | Reason                                           |
| ----------------------------- | ----- | ------------------- | ------------------------------------------------ |
| `Segmented`: 26               | 40px  | `size-control-s`    | Narrowest speed segment: the 44px hit areas meet |
| `Tabs`: 104                   | 20px  | `size-checkbox`     | A one-digit count stays round                    |
| `LoadingBar`: 6               | 20px  | `size-checkbox`     | Line height of the text it stands for            |
| `Toast`: 9                    | 48px  | `size-field-l`      | Toast and Banner shape                           |
| `Toast`: 41                   | 50px  | `size-control-l`    | Toast with its border                            |
| `Toast`: 68                   | 52px  | `size-search`       | Banner on a desktop                              |
| `BottomSheet`: 25             | 20px  | `size-checkbox`     | Grabber box                                      |
| `Popup`: 202, 206             | 16px  | `size-gutter-phone` | Pointer square                                   |
| `Legend`: 44                  | 16px  | `size-gutter-phone` | Hatch swatch                                     |
| `CountMarker`: 46, 47, 58, 59 | 36px  | `size-chip`         | Hovered disc                                     |
| `CountMarker`: 75, 76         | 40px  | `size-control-s`    | Pressed halo                                     |
| `PinFan`: 73, 76              | 36px  | `size-chip`         | Disc                                             |
| `PinFan`: 91, 92, 103, 104    | 40px  | `size-control-s`    | Hovered disc                                     |
| `PinFan`: 120, 121            | 44px  | `size-touch`        | Pressed halo                                     |
| `TextAreaField`: 42           | 8px   | `space-8`           | Mark in line with the first text line            |
| `DateSlider`: 21              | 12px  | `space-12`          | Track centre on the thumb centre                 |
| `DateSlider`: 34, 43          | 8px   | `space-8`           | Band and ticks centred on the track              |
| `DateSlider`: 53              | 24px  | `space-24`          | Years under the track                            |
| `DateSlider`: 87              | 8px   | `space-8`           | Centres the 28px track in the 44px hit area      |
| `Popup`: 201                  | 2px   | `radius-link`       | Soft corners of the pointer                      |
| `ContestedNote`: 17           | 2px   | `radius-link`       | Soft corners of the swatch                       |
| `DateSlider`: 30              | 2px   | `radius-link`       | Soft corners of the contested band               |
| `PinPopup`: 55                | 16px  | `type-body-l-size`  | Event glyph size                                 |
| `PinFan`: 72                  | 22px  | `type-h3-size`      | Glyph size in the disc                           |
| `Callout`: 15                 | 600   | `type-label-weight` | Bold text in small text                          |
| `Credits`: 35                 | 1     | `z-furniture`       | Buttons above the open card, inside the line     |
| `PlaceMarker`: 3              | 1     | `z-furniture`       | An open fan above nearby markers                 |

If D1 is B, the build moves the seven values of D1 B to new tokens. If D3 is B, the two `--radius-bar` lines move to `own:`.

## Order of work

1. Write `literals.test.ts` with its fixtures. See each case fail on the behaviour ([test-first rule](BUILD.md#test-first)).
2. Write `literals.mts`. See the fixtures pass and the repo files fail.
3. Add the new tokens and notes. Run `npm run tokens`.
4. Fix each literal of the list. See the repo test pass.
5. Edit the row of `docs/architecture.md`.
6. Run the checks of `AGENTS.md` › Commands. Paste the scratch `gap: 8px` failure in Evidence.
7. Run `npm run design-system` (step 2 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system)).
8. A local Claude Code session that the tech lead starts runs steps 3 to 5. The session needs a signed-in account. The CI build keeps the PR a draft and asks for this in the PR.
9. Step 6: no board shows the change, because no rendered value changes. Push. If the `design` or `gallery` job fails, run Design: Render snapshots.

## Risks

- A multi-line value, such as a `box-shadow` list, has a line for each part. The module gives each part the line it is on, so an `own:` comment goes on that line. A fixture proves it.
- Prettier can move a long trailing comment. The build runs `npm run format` before the test.

## Proof

| Acceptance check                                      | Proven by                                      |
| ----------------------------------------------------- | ---------------------------------------------- |
| The test passes on the branch                         | `npm test`                                     |
| Each case of step 2 fails                             | Fixtures in `literals.test.ts`                 |
| A scratch `gap: 8px` fails the test                   | Evidence, not committed                        |
| Each literal of the list is fixed                     | The repo case of `literals.test.ts`; the diff  |
| New tokens have notes; `app/tokens.css` is current    | `design.test.ts` (`noteProblems`, stale check) |
| `docs/architecture.md` holds steps 5 and 6            | The diff                                       |
| Steps 2 to 6 ran; sha256 match; "No snapshot changed" | Evidence from the local session                |
| Lint, typecheck, words, tests and coverage pass       | Evidence                                       |

## Out of scope

- Literals in `app/globals.css` or in `.tsx` style props: the issue names `.module.css` files only.
- The `layout` group.

## Deviations
