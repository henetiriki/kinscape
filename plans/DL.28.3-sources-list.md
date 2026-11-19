# Plan: DL.28.3: The sources list joins the design system

- **Spec:** #1073
- **Requirement IDs:** None. The Spec changes the design system, the export and two boards, and no screen.
- **Status:** approved

## Approach

Add `SourcesList` to `CONTROLS` after `FilterFields`, so that the group "Map" holds ten cards. The component does not change (check 5).

A card state can name a form (D1). `State` gains `form?: { box: string; name: string }`. The preview gives the `figure` of such a state `data-form` and an inline `width` from the form's `box`. A state with no form takes the card's `box`. `cards.mts` exports the attribute name as `FORM_ATTRIBUTE`. A test fails if `DialogPanel` sets a different name.

The card:

| Field    | Value                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `box`    | `SOURCES_BOX`, `'704px'`: the body of the centred dialog, 760px less 28px padding on each side (D3).                      |
| `design` | `['Sources and attributions dialog']` (D2).                                                                               |
| `width`  | 760, the width of the dialog (item 3).                                                                                    |
| `height` | From the render. Start value 1600.                                                                                        |
| States   | `SourcesList · table`: `{ sources }`. `SourcesList · list`: `{ sources }`, form `{ box: SHEET_BOX, name: 'sheet' }` (D1). |

`SHEET_BOX` is `'358px'`: the sheet body on a 390px phone, less 16px padding on each side. Both constants have a comment, as `PANEL_BOX` has. `states.mts` imports `#ks/data/sources.json` with `{ type: 'json' }`, so no file holds a second copy of the rows. The card does not join `PHONE_CARDS`: `SourcesDialog.module.css` has no width rule, and the card has only a 1440px image (D1).

`designBullets` reads a bold bullet in any `##` section (D2). It throws if a name has no bullet, or if two sections hold the name. In `design/DESIGN.md` › Attributions, the dialog line gets the bold name "Sources and attributions dialog". "That link" becomes "the "Attributions" link", so the README line reads on its own.

`pageHtml` in `scripts/design-export.mts` sets each `href` that starts with `http://` or `https://` to `#` (D4). This happens before `snapshotProblems` runs, so the eight `TextLink` licences pass check 8.

Each board holds one line `const SOURCES_DIALOG = { … };` with JSON text: the title, the subtitle, the footnote and the eight rows. A new test reads that line from each board and compares it with `{ ...SOURCES_WORDS, sources }`. The test names the board when it fails. #1074 item 10 can read the same line on `Map.dc.html` for `Credits`.

A local session swaps the `sources` variant of both boards (step 7):

- `Map.dc.html`: a placing box at left 340px and top 112px holds `KinScape.DialogPanel` with `form="centred"`, and `KinScape.SourcesList` inside it.
- `Map-phone-states.dc.html`: a placing box from top 56px (`--layout-phone-sources-top`) to the bottom holds `KinScape.DialogPanel` with `form="sheet"`. The box is a one-row grid, so the panel fills it and its body scrolls, as in the drawn sheet.
- The props come from `SOURCES_DIALOG`. The drawn dialog, the drawn sheet, the `sources` arrays and their row styles go. The scrim stays a plain box.

## Decisions

**D1 to D4** have answers from the tech lead on #1073: D1 B, D2 B, D3 A, D4 A, with the box for each form. The Approach follows them.

**D5 · The placeholder line in `DESIGN.md`** · Decides: Tech lead

`design/DESIGN.md` › Attributions says: "The JPGs show `[Source]` and `[Licence]` until someone completes the checks." After item 7, `map-sources.jpg` and `map-sources-phone.jpg` show the eight checked rows of `data/sources.json`. The drawn rows for District borders, Place names and Terrain go, because the file has no source for them. #1074 holds no value for this line.

- **A.** Reword the line: "The boards show the rows of `data/sources.json`. A test keeps them in step." Cost: one line of a design system input that this Spec already changes.
- **B.** Delete the line. Cost: one line, and `DESIGN.md` no longer says where the board rows come from.
- **C.** Keep the line. Cost: `DESIGN.md` then describes JPGs that no longer exist.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                         | New / changed | What                                                                                                                              |
| ------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                                        | changed       | `State.form`. The `Card.design` comment says "any section".                                                                       |
| `lib/design/cards.mts`                                       | changed       | `FORM_ATTRIBUTE`, the form on each `figure`, and `designBullets` over each section.                                               |
| `lib/design/states.mts`                                      | changed       | `SOURCES_BOX`, `SHEET_BOX` and the `SourcesList` card after `FilterFields`.                                                       |
| `lib/design/bundle.mts`                                      | changed       | `SourcesList` after `FilterFields`.                                                                                               |
| `scripts/design-export.mts`                                  | changed       | D4 in `pageHtml`.                                                                                                                 |
| `design/DESIGN.md`                                           | changed       | The bold name of D2, and D5.                                                                                                      |
| `docs/architecture.md`                                       | changed       | The React 18 row names `SourcesDialog`.                                                                                           |
| `lib/design/__tests__/cards.test.ts`                         | changed       | `designBullets` in another section, and on a name in two sections. A state form in the preview. Groups `[14, 6, 8, 10, 8, 9, 3]`. |
| `lib/design/__tests__/bundle.test.ts`                        | changed       | 58 controls, with `SourcesList`.                                                                                                  |
| `lib/design/__tests__/react-18.test.tsx`                     | changed       | One import, one `COMPONENTS` entry, two cases, and the `FORM_ATTRIBUTE` test on `DialogPanel` and the list state.                 |
| `scripts/__tests__/design-system.test.ts`                    | changed       | The two `toHaveLength(57)` become 58.                                                                                             |
| `scripts/__tests__/design-export.test.ts`                    | changed       | `pageHtml` sets `http://` and `https://` links to `#`, and keeps `#a` and `/people`.                                              |
| `design/__tests__/sources-boards.test.ts`                    | new           | Item 7.                                                                                                                           |
| `design/cards/SourcesList-1440.png`                          | new           | The workflow writes it.                                                                                                           |
| `design/canvas/project/Map.dc.html`                          | changed       | Step 7: the `sources` variant.                                                                                                    |
| `design/canvas/project/Map-phone-states.dc.html`             | changed       | Step 7: the `sources` variant.                                                                                                    |
| `design/source/map-sources*.html`, `design/map-sources*.jpg` | changed       | The workflow writes them.                                                                                                         |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`        | changed       | Steps 4 and 5 of Changing the design system.                                                                                      |

## Order of work

1. Change the tests of Files that change, except the board test. See them fail on the counts, the form, the section and the link ([test-first rule](README.md#test-first)).
2. Change `types.ts`, `cards.mts`, `bundle.mts`, `states.mts`, `design-export.mts`, `DESIGN.md` and the row in `docs/architecture.md`.
3. Run `npm run design-system` and `npm run design:gallery`. Set the card height from the render. Then run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
4. Push. Keep the PR as a draft ([design-system rule](README.md#design-system)).

Then do steps 3 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system):

- The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5. The session needs a signed-in account.
- The tech lead runs the workflow Design: Render snapshots (step 6). It commits the card image.
- A local session adds the board test, sees it fail, and swaps both boards in the repo copy (step 7). It runs `npm run design:export` and pushes. The tech lead runs the workflow.
- When the render passes check 9, the session publishes the two boards to the canvas and runs "Refreshing the canvas copy" (5.1 to 5.5).
- The build rewords #1073 ([reword step](../.github/agent/build.md#reword)): the Summary and Behaviour name the export (D4), item 3 and checks 2 and 3 follow D1 and D3, and item 4 names the bold name (D2).

## Risks

- **Other board edits.** #1071, #1072 and #1074 change the same boards. The one that lands later merges the earlier edit, and its JPGs are the baseline for its check.
- **The bundle.** `SourcesDialog.tsx` imports the `Source` type, and `index.d.ts` then holds its declaration. If `SourcesList` cannot mount, stop and comment the error on #893. The PR states the size of `bundle.js` before and after.
- **The phone sheet.** If the grid box does not let the body scroll, the sheet runs off the board. The build compares `map-sources-phone.jpg` with `main` before it pushes.
- **A later change to `data/sources.json`.** It changes the card image and both JPGs, and the board test asks for a board edit.

## Proof

| Acceptance check | Proven by                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| 1                | `design-system.test.ts` (58) and the line 1 test.                                           |
| 2, 3             | `npm run design:gallery` in the pinned image, and the workflow's card image.                |
| 4                | `react-18.test.tsx` "states" and "mounts with the props of its first case".                 |
| 5                | `git diff origin/main --stat -- features/map/components/` is empty.                         |
| 6                | The step 7 diff of both boards.                                                             |
| 7                | `design/__tests__/sources-boards.test.ts`.                                                  |
| 8                | `npm run design:export` in step 7, and the `design` job.                                    |
| 9                | The workflow's commit: only `map-sources` and `map-sources-phone` change.                   |
| 10, 11           | The commits of steps 4, 5 and 7, the workflow runs, and step 4.6 of "Updating the install". |
| 12               | Step 4.7 of "Updating the install".                                                         |
| 13               | Command output in the PR, with 100% coverage.                                               |

## Out of scope

- A card for the modal `SourcesDialog`, the credits line (#1074) and the scale bar: the Spec's Out of scope.
- Bold names for the two credits sentences: #1074 (D2).
