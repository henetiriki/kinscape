# Plan: B943: TextLink is 22px tall with no 44px hit area on a phone

- **Spec:** #943 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

`TextLink` gets the hit area that `Button` and `Chip` already use. `.textLink` becomes `position: relative`. An enabled link gets a `::before`, centred on the link, `var(--size-touch)` tall and `max(100%, var(--size-touch))` wide. The disabled `<span>` gets none. The anchor keeps no `min-height`, so a link in running text keeps its line height. The five TextLink rows leave `UNDER_44` in `e2e/gallery-looks.spec.ts`, because that test fails while a fixed control stays in the list.

`TextLink` is in `CONTROLS`, so the change is a [design system input](../../design/CANVAS.md#changing-the-design-system). The hit area is not visible, so no board shows the change.

On `main`, `npm run e2e -- --config e2e/gallery.config.ts e2e/gallery-looks.spec.ts -g "keeps a 44px hit area"` passes. Its last assertion needs each `UNDER_44` row to fail, so the Bug still reproduces.

## Decisions

**D1 · The PersonRow Relationships link (#945)** · Decides: Tech lead

The Relationships link in `PersonRow` is a `TextLink`. #945 holds its `UNDER_44` row: 22px tall, no hit area. The `TextLink` fix most likely gives that link a hit area too. Then its row in `UNDER_44` makes the test fail.

- **A.** Remove the #945 row too. The PR body says `Closes #945`. Cost: one more line in the spec file.
- **B.** Remove the #945 row, and leave #945 open. Its own plan checks the PersonRow layout, for example a tap between the row link and the Relationships link. Cost: one more plan and PR.
- **Other:** your own.

**Answer: A** (@henetiriki)

If the #945 row still fails after the fix, D1 has no effect, and the row stays.

**D2 · When to run the design system steps 3 to 5** · Decides: Tech lead

The design system artifact holds the `spec/DL.16-colour-roles` content (stamp `31fde80`). This branch has no DL.16. A publish from here replaces the DL.16 `README.md`, `tokens.json`, `bundle.css` and `bundle.js` in the artifact.

- **A.** Skip steps 3 to 5 now. Run them after DL.16 merges and this branch rebases on `main`. Cost: the PR stays a draft until then.
- **B.** Publish now. DL.16 must then publish again.
- **C.** Rebase this branch on `spec/DL.16-colour-roles` and publish from there.
- **Other:** your own.

**Answer: A** (tech lead)

## Files that change

| File                                                  | New / changed | What                                                                                            |
| ----------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `app/components/actions/TextLink.module.css`          | changed       | `position: relative` on `.textLink`; the `::before` hit area on an enabled link                 |
| `app/components/actions/__tests__/TextLink.test.tsx`  | changed       | A test that the enabled link has the `::before` at `var(--size-touch)` and the disabled one not |
| `e2e/gallery-looks.spec.ts`                           | changed       | Remove the `#943` rows from `UNDER_44`, and the `#945` row if D1 applies                        |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Design system steps 4 and 5                                                                     |

## Order of work

1. Write the unit test. See it fail on the missing `::before` rule.
2. Remove the `#943` rows from `UNDER_44`. Run `npm run design-system`, then the gallery test. See it fail with the five TextLink rows.
3. Change `TextLink.module.css`. Run the unit test and the gallery test again.
4. If the #945 row now fails the "fixed leaves the list" assertion, remove it as D1 says.
5. Run the checks in `AGENTS.md` › Commands, the gallery config and `npm run design:check`.
6. Design system steps 2 to 6. The build runs step 2 (`npm run design-system`) and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 and step 6. The session needs a signed-in account. No board shows the change, so step 7 does not apply. The PR stays a draft until then.

## Risks

- **Overlap.** The 44px area reaches 11px above and below a 22px link. In a stack of links less than 44px apart, the lower link takes a tap on the bottom edge of the link above it. The pins of `Popup` are 32px rows, so a tap on the people line of a pin can open the title link of the next pin. No shown screen or past incident reaches this. A fix gives the pin title a smaller area or the pin row 44px, at about 5 lines and one snapshot.
- **Snapshots.** `position: relative` can move the stacking order of a link over its neighbours. `npm run design:check` shows any change. If a blocking snapshot changes, the build stops for the tech lead.

## Proof

| Acceptance check                                                     | Proven by                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A point 21px above and below the centre of each TextLink is the link | `e2e/gallery-looks.spec.ts` "keeps a 44px hit area", with the `#943` rows gone |
| The enabled link has the hit area; the disabled text has none        | `TextLink.test.tsx`                                                            |
| The button form keeps its 44px `min-height`; the anchor has none     | `TextLink.test.tsx`, the existing test                                         |
| The look of each TextLink state does not change                      | `npm run design:check`; the TextLink card images in the gallery job            |
| Each TextLink stays a Tab stop with the 2px brand ring               | `e2e/gallery-looks.spec.ts` "Tab visits each enabled control"                  |

## Out of scope

- `ArrowLink` (#944) and the other `UNDER_44` Bugs (#946 to #951).

## Deviations
