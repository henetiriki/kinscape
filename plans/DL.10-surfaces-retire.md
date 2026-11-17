# Plan: DL.10: The surfaces tests move, and /design-kit/surfaces goes

- **Spec:** #911
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The seven look tests go to `e2e/gallery-looks.spec.ts`. Each test opens its gallery file with `open` and finds its control by the caption of a card state, as the DL.9 tests do:

| Test                                            | Card state                                                |
| ----------------------------------------------- | --------------------------------------------------------- |
| Notice card 40px buttons, 360 and 380 wide      | `NoticeCard · one action`, `NoticeCard · large`           |
| Progress bar eases, and not with reduced motion | `ProgressBar · 40`                                        |
| Callout 12px padding and floating shadow        | `Callout · error`                                         |
| Phone notice card                               | `NoticeCard · one action` at 390px                        |
| Close and Copy chain hit area                   | `Popup · floating`, with `hitsControl` in four directions |
| Large card in a 320px block parent              | `NoticeCard · large`                                      |

The new test in `e2e/account-menu.spec.ts` uses the keys, as the deleted board test did: ArrowDown, Enter, then Esc. On `/` the second item is "Sources and attributions". The native `<dialog>` of `Modal` gives focus back to the Avatar.

`e2e/design-kit.spec.ts` gets a `RETIRED` set that holds `/design-kit/surfaces`. `BOARD_LINKS` keeps all nine boards, so the bar and Tab order checks still expect "Surfaces". The index test and the nav loop skip a path in `RETIRED`. One new test opens each path in `RETIRED` and expects a 404 (check 4). The later retirements add their paths to the set.

Two board tests go with their files and need no new home: "part 2 shows the callout alone" and "part 2 shows the sheet Popup alone". They test the board's own split into parts. The PR body names them with the five tests of item 3.

After the folder goes, only the surfaces board passes `wide` to `Measurements`, and only it imports `Measurements` and `Accessibility`. D2 removes that dead code, so the 100% coverage gate holds.

## Decisions

**D2 · The code in `inputs/Board.tsx` that only the surfaces board used** · Decides: Tech lead

The Spec names no change to `app/design-kit/inputs/`. After the surfaces folder goes, nothing passes `wide` to `Measurements`, and the `wide` branch loses its coverage. No other file imports `Measurements` or `Accessibility`. #912 deletes most of `app/design-kit/inputs/` and keeps `Board.tsx`. #922 deletes `Board.tsx` if no file imports it.

- **A.** Remove the `wide` prop and its two `.table[data-wide]` rules in `inputs/page.module.css`. `Measurements` and `Accessibility` stop being exports. Change the `desktopPart` comment from "Boards 07 and 08" to "Board 08".
- **B.** Keep the code. Add a unit test that renders `Measurements` with `wide`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A `v8 ignore` on the `wide` branch. It hides dead code, so D2 does not offer it.
- One `RETIRED` check in each test of `e2e/design-kit.spec.ts`. One set at the top serves this Spec and the retirements after it.

## Files that change

| File                                                 | New / changed | What                                                           |
| ---------------------------------------------------- | ------------- | -------------------------------------------------------------- |
| `e2e/gallery-looks.spec.ts`                          | Changed       | The seven tests of item 1                                      |
| `e2e/account-menu.spec.ts`                           | Changed       | The focus test of item 2, tagged `// NFR-06`                   |
| `e2e/widths.spec.ts`                                 | Changed       | The large NoticeCard test goes                                 |
| `e2e/surfaces.spec.ts`, `e2e/menu-popup.spec.ts`     | Deleted       | Item 5.2                                                       |
| `e2e/design-kit.spec.ts`                             | Changed       | `RETIRED`; the index and nav tests skip it; the 404 test       |
| `app/design-kit/surfaces/` (6 files, 2 tests)        | Deleted       | Item 5.1                                                       |
| `app/design-kit/inputs/Board.tsx`, `page.module.css` | Changed       | D2                                                             |
| `lib/design/__tests__/react-18.test.tsx`             | Changed       | `CHAIN` and `PINS` from `@ks/lib/design/samples.mts`           |
| `lib/design/__tests__/screens.test.ts`               | Changed       | `NO_ENTRY` gains the four `style-7-components-surfaces*` names |
| `design/screens.json`                                | Changed       | The four surfaces entries go                                   |

## Order of work

1. Reword #912 check 4 as Spec D1 A says, by the [reword step](../.github/agent/build.md#reword).
2. Add the seven gallery tests. Run `npm run design:gallery`, with no app server on port 3000.
3. Add the account menu test. Run it on `/`.
4. Change the `react-18.test.tsx` import.
5. Delete the board folder, the two specs, the widths test and the four screen entries. Add the four names to `NO_ENTRY`.
6. Change `e2e/design-kit.spec.ts`. Apply D2.
7. Run `git grep design-kit/surfaces -- ':!plans/'`. Paste the output in the PR.
8. Run the checks of `AGENTS.md` › Commands, and `npm run design:check`.

## Risks

- The 360px and 380px widths can differ in the gallery's flex row. Then follow the Spec's Flagged concern. The board cannot go while it holds that test, so stop for the tech lead ([big-departures rule](README.md#big-departures)).
- A component test may cover a branch only through the board tests. If `npm test` shows a gap in `app/components/`, add a unit test of the component in its `__tests__/`.
- A check may need a screen entry for each canvas board. Then follow the Spec's Flagged concern: stop, and comment on #893.
- #916, #912 and #922 also add tests to `e2e/gallery-looks.spec.ts`. The second PR to merge resolves the conflict.

## Proof

| Acceptance check | Proven by                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| 1                | `npm run design:gallery` output, and the `design` job                       |
| 2                | The new test in `e2e/account-menu.spec.ts`                                  |
| 3                | The `git grep` output of step 7                                             |
| 4                | The 404 test in `e2e/design-kit.spec.ts`                                    |
| 5                | `npm run design:check` output, and the `design` job                         |
| 6                | `git diff main --stat -- design/canvas design/source 'design/*.jpg'` output |
| 7                | The diff of `react-18.test.tsx`                                             |
| 8                | CI, and the pasted output of each command                                   |

## Out of scope

- The `SG-Surfaces` boards, their snapshots, JPGs and `design/DESIGN.md` rows: DL.21.
- The rest of `app/design-kit/inputs/`: #912 and #922.

## Deviations

- The phone notice card test checks the card's figure for sideways scroll, not the whole file. The large card of that file is a fixed 380 wide, so the file scrolls at 390px.
- `e2e/design-kit.spec.ts` builds the paths of `surfaces` from a `board(slug)` helper, so check 3 finds no route text in `e2e/`.
