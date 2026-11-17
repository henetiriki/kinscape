# Plan: DL.10: The surfaces tests move

- **Spec:** #911
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

Six look tests go to `e2e/gallery-looks.spec.ts`. Each test opens its gallery file with `open` and finds its control by the caption of a card state, as the DL.9 tests do:

| Test                                            | Card state                                                |
| ----------------------------------------------- | --------------------------------------------------------- |
| Notice card 40px buttons, 360 and 380 wide      | `NoticeCard · one action`, `NoticeCard · large`           |
| Progress bar eases, and not with reduced motion | `ProgressBar · 40`                                        |
| Callout 12px padding and floating shadow        | `Callout · error`                                         |
| Close and Copy chain hit area                   | `Popup · floating`, with `hitsControl` in four directions |
| Large card in a 320px block parent              | `NoticeCard · large`                                      |

The new test in `e2e/account-menu.spec.ts` uses the keys, as the deleted board test did: ArrowDown, Enter, then Esc. On `/` the second item is "Sources and attributions". The native `<dialog>` of `Modal` gives focus back to the Avatar.

The board `/design-kit/surfaces` stays, with its folder, its `design/screens.json` entries and `NO_ENTRY`. `e2e/design-kit.spec.ts` and `inputs/Board.tsx` do not change. D3 gives the reason. #929 (DL.21) retires the board.

- `e2e/surfaces.spec.ts` keeps the phone notice card test and "part 2 shows the callout alone".
- `e2e/menu-popup.spec.ts` keeps "part 2 shows the sheet Popup alone".
- Each other test of the two files goes. A gallery test or a Vitest test proves it.

Five tests go, and a Vitest test proves each. The PR body names them with the reason.

## Decisions

**D3 · The phone notice card test** · Decides: Tech lead

The Spec moves this test to the `NoticeCard` gallery file at 390px. The large card of that file is a fixed 380 wide, so the file scrolls sideways at 390px. A test of the card's figure alone checks less than the old test, which checked the whole page.

- **A.** Keep the test in `e2e/surfaces.spec.ts`. The board stays until a gallery file can show the test. #929 retires the board.
- **B.** Move the test, check the figure alone, and rename it.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Retire the board and move the phone test with a looser check. D3 B gives that option.

## Files that change

| File                                             | New / changed | What                                                 |
| ------------------------------------------------ | ------------- | ---------------------------------------------------- |
| `e2e/gallery-looks.spec.ts`                      | Changed       | The six tests of the table                           |
| `e2e/account-menu.spec.ts`                       | Changed       | The focus test of item 2, tagged `// NFR-06`         |
| `e2e/widths.spec.ts`                             | Changed       | The large NoticeCard test goes                       |
| `e2e/surfaces.spec.ts`, `e2e/menu-popup.spec.ts` | Changed       | Only the three tests of the approach stay            |
| `lib/design/__tests__/react-18.test.tsx`         | Changed       | `CHAIN` and `PINS` from `@ks/lib/design/samples.mts` |

## Order of work

1. Reword #912 check 4 as Spec D1 A says, by the [reword step](../.github/agent/build.md#reword).
2. Add the six gallery tests. Run `npm run design:gallery`, with no app server on port 3000.
3. Add the account menu test. Run it on `/`.
4. Change the `react-18.test.tsx` import.
5. Remove the moved tests from the two board specs and from `widths.spec.ts`.
6. Run the checks of `AGENTS.md` › Commands, and `npm run design:check`.

## Risks

- The 360px and 380px widths can differ in the gallery's flex row. Then follow the Spec's Flagged concern: keep that test where it is, and stop for the tech lead ([big-departures rule](README.md#big-departures)).
- #916, #912 and #922 also add tests to `e2e/gallery-looks.spec.ts`. The second PR to merge resolves the conflict.

## Proof

| Acceptance check | Proven by                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| 1                | `npm run design:gallery` output, and the `design` job. Six tests run.       |
| 2                | The new test in `e2e/account-menu.spec.ts`                                  |
| 3, 4             | Not met in this PR. #929 meets them.                                        |
| 5                | `npm run design:check` output, and the `design` job                         |
| 6                | `git diff main --stat -- design/canvas design/source 'design/*.jpg'` output |
| 7                | The diff of `react-18.test.tsx`                                             |
| 8                | CI, and the pasted output of each command                                   |

## Out of scope

- The retirement of the board, the `SG-Surfaces` boards, their snapshots, JPGs and `design/DESIGN.md` rows: #929.
- The rest of `app/design-kit/inputs/`: #912 and #922.
