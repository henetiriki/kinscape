# Plan: DL.21.3: The style guide boards go from the canvas

- **Spec:** #993
- **Requirement IDs:** None. The plan deletes boards and their generated files.
- **Status:** draft

## Approach

A local session that the tech lead starts builds the whole Spec, because only it edits the canvas and deletes a generated file. It deletes the 27 `SG-*` and `Kit-*` boards and the canvas page "Style guide", then refreshes `design/canvas/`. It removes the records that the rule [Who deletes a generated file](../design/CANVAS.md#who-deletes-a-generated-file) lists, and narrows `lib/design/shots.mts`. The Screens table is not in `README_SECTIONS` (`lib/design/system.mts`), so the design system output does not change, and the steps of "Changing the design system" do not apply. The build starts after DL.21.2 (#992) merges, because #992 changes the sentence of `design/DESIGN.md` that links to `style-4-states.jpg`.

## Decisions

**D1 · How the Map-style boards lose their links to the deleted boards** · Decides: Tech lead

On `main`, `Map-style.dc.html` links to `Kit-index.dc.html` and the 8 desktop `SG-*` boards (lines 20 to 30). `Map-style-phone.dc.html` links to `Kit-index-phone.dc.html` and `Kit-menu-phone.dc.html` (lines 16 and 17). After the deletion, `npm run design:export` fails on these 11 links, because `FORBIDDEN` in `scripts/design-export.mts` holds `.dc.html`. The Flagged concern says "remove the link" and "change nothing else". Behaviour 2 and check 4 say that no other board and no JPG change. How do the links go?

- **A.** Remove only the `href` attribute of the 11 links. The inline styles keep the look, so `map-style.jpg` and `map-style-phone.jpg` do not change. `map-style.html` and `map-style-phone.html` lose 11 `href` values. The header still says "KinScape design kit". Cost: 11 attribute edits.
- **B.** Remove the header with the kit title and the "Boards" links from both boards. The two JPGs change, so Behaviour 2 and 6 and check 4 need an exception. That is a change to the Spec. Cost: two board edits, two JPGs and a Spec rewrite.
- **Other:** your own.

Recommended: A, because the Flagged concern says to change nothing else on the board, and check 4 stays true. B also removes the kit title from a reference sheet, which the Spec puts out of scope.

## Alternatives considered

- A CI build: the CI agent has no claude.ai access, and it does not delete a generated file.

## Files that change

| File                                                                             | New / changed | What                                                                                     |
| -------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `design/canvas/project/SG-*.dc.html` (24), `Kit-*.dc.html` (3)                   | Deleted       | The 27 boards.                                                                           |
| `design/canvas/project/canvas.json`                                              | Changed       | The refresh removes the page "Style guide" and the 27 boards.                            |
| `design/canvas/project/Map-style.dc.html`, `Map-style-phone.dc.html`             | Changed       | The 11 links lose `href` (D1).                                                           |
| `design/canvas/VERSION`                                                          | Changed       | Line 2: the canvas version.                                                              |
| `design/canvas/export.json`                                                      | Changed       | The 27 `snapshots` entries and the `links` entry `Kit-menu-phone.dc.html` go.            |
| `design/source/style-*.html` (24), `design-kit*.html` (3)                        | Deleted       | The 27 snapshots.                                                                        |
| `design/source/map-style.html`, `map-style-phone.html`                           | Changed       | The export writes them without the 11 `href` values (D1).                                |
| `design/style-*.jpg` (24), `design/design-kit*.jpg` (3)                          | Deleted       | The 27 JPGs.                                                                             |
| `design/DESIGN.md`                                                               | Changed       | The 27 rows of the Screens table go.                                                     |
| `lib/design/__tests__/screens.test.ts`                                           | Changed       | The 27 names go from `NO_ENTRY`.                                                         |
| `lib/design/__tests__/design.test.ts`, `scripts/__tests__/design-export.test.ts` | Changed       | The snapshot count is 66, not 93.                                                        |
| `lib/design/shots.mts`                                                           | Changed       | `PHONE_BOARD` matches `map-style-phone` only. `shotFor` loses `style-`. Comments follow. |
| `lib/design/__tests__/shots.test.ts`                                             | Changed       | The 4 rows that name a deleted board go.                                                 |

## Order of work

1. Check that #992 is merged on `main`. Check that `design/canvas/project/` on `main` holds the 27 boards.
2. A local session removes the 11 `href` attributes on the canvas (D1). It deletes the 27 boards and the page "Style guide".
3. The session runs "Refreshing the canvas copy" (5.1 to 5.5):
   - Before 5.4, it runs `git rm` on the 27 board files and removes the records of `design/canvas/export.json`.
   - In 5.4, `npm run design:export` writes the two `map-style` snapshots.
   - In 5.5, it commits `canvas/` and the two snapshots.
4. One commit deletes the 27 snapshots and the 27 JPGs, and nothing else (check 8).
5. One commit removes the Screens rows, the `NO_ENTRY` names and the counts.
6. One commit changes `shots.mts` and `shots.test.ts`.
7. Run the checks in `AGENTS.md`. Push. The tech lead runs the workflow Design: Render snapshots on the branch.

## Risks

- If a `map-style` JPG changes under D1 A, check 4 fails. Then stop and comment on #893.
- Until #992 merges, `scripts/__tests__/doc-links.test.ts` fails on the link to `style-4-states.jpg`. Step 1 stops the build.
- A canvas deletion cannot be undone from the repo alone. Step 1 checks that git history keeps each board.
- If another Spec changes a count first, use the count of the day, and say so in the PR.

## Proof

`shots.mts` loses behaviour and gains none. No new test can fail first, and check 7 forbids a row that names a deleted board.

| Acceptance check | Proven by                                                                          |
| ---------------- | ---------------------------------------------------------------------------------- |
| 1                | `git ls-files` of the three folders, pasted in the PR                              |
| 2                | `git diff main -- design/canvas/project/canvas.json`, pasted in the PR             |
| 3                | `npm run design:export` output; `design-export.test.ts` expects 66                 |
| 4                | The workflow run, linked in the PR, with no commit                                 |
| 5                | `lib/design/__tests__/screens.test.ts`                                             |
| 6                | `git grep` of the 27 names in `design/canvas/export.json`, pasted in the PR        |
| 7                | `git grep -E "style-[0-9]\|'style-'\|design-kit" -- lib scripts`, pasted in the PR |
| 8                | The automated review of the commit of step 4; a finding goes on #893               |
| 9                | The command output, pasted in the PR                                               |
