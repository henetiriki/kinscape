# Plan: B944: ArrowLink is 22px tall with no 44px hit area on a phone

- **Spec:** #944 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The link form of `ArrowLink` gets the hit area of `TextLink` (#943). `.link` becomes `position: relative`, with a centred `::before`, `var(--size-touch)` tall and `max(100%, var(--size-touch))` wide. The label form gets none, because the row around it is the link. The link keeps its 22px line height. The four ArrowLink rows leave `UNDER_44` in `e2e/gallery-looks.spec.ts`, because that test fails while a fixed control stays in the list.

`ArrowLink` is in `CONTROLS`, so the change is a [design system input](../../design/CANVAS.md#changing-the-design-system). No board shows the invisible hit area.

On `main`, `npm run design:gallery -- -g "each control under 44px"` passes, so each `UNDER_44` row still fails: the Bug reproduces.

## Decisions

**D1 · The RelationshipRow Edit link (#946)** · Decides: Tech lead

The Edit link of `RelationshipRow` is an `<ArrowLink href>`. #946 holds its two `UNDER_44` rows. The fix gives that link a hit area too, so those rows make the test fail. The row is at least 52px tall (`--size-row-l`), so the area stays inside the row.

- **A.** Remove the #946 rows too. The PR body says `Closes #946`. Cost: two lines.
- **B.** Remove the #946 rows, and leave #946 open for its own plan. Cost: one more plan and PR.
- **Other:** your own.

**Answer: A** (@henetiriki)

If a #946 row still fails after the fix, D1 has no effect, and the row stays.

**D2 · One hit-area rule for TextLink and ArrowLink** · Decides: Tech lead

The new rule is the same six lines as the `::before` rule of `TextLink.module.css`. `docs/code-rules.md` says to keep logic in one place. `foundation/focus.module.css` is the pattern for a shared rule.

- **A.** Copy the rule into `ArrowLink.module.css`, as `Button`, `Chip` and `TextLink` each hold their own. Cost: about 10 lines.
- **B.** Add `app/components/foundation/touch.module.css`: a `.touch` class with `position: relative` and the centred `::before`. `ArrowLink` `.link` and the enabled `TextLink` take it with `composes`. Cost: about 30 lines, and `TextLink` becomes a second design system input.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · When to run the design system steps 3 to 5** · Decides: Tech lead

PR #1017 (DL.21.2) merged. It changed `bundle.css`, `bundle.js`, `tokens.json` and `README.md` in the canvas copy, so the artifact most likely holds them. This branch has `main` merged in, so a publish from here keeps that content.

- **A.** Run steps 3 to 5 now that this branch has `main`. Cost: the PR stays a draft until a local session runs them.
- ~~**B.** Publish before `main` is in this branch. DL.21.2 must then publish again.~~
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                  | New / changed   | What                                                             |
| ----------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `app/components/actions/ArrowLink.module.css`         | changed         | The hit area on `.link`                                          |
| `app/components/actions/__tests__/ArrowLink.test.tsx` | changed         | `.link` has the hit area; `.arrowLink` has none                  |
| `e2e/gallery-looks.spec.ts`                           | changed         | Remove the `#944` rows from `UNDER_44`, and the `#946` rows (D1) |
| `app/components/foundation/touch.module.css`          | new (D2: B)     | The shared hit-area class                                        |
| `app/components/actions/TextLink.module.css`          | changed (D2: B) | `composes` the shared class                                      |
| `app/components/actions/__tests__/TextLink.test.tsx`  | changed (D2: B) | The hit-area test reads the shared class                         |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed         | Design system steps 4 and 5                                      |

## Order of work

1. Write the unit test. See it fail on the missing hit area of `.link`.
2. Remove the `#944` rows from `UNDER_44`. Run `npm run design:gallery -- -g "each control under 44px"`. See it fail with the four ArrowLink rows.
3. Change `ArrowLink.module.css`, and the D2 files if D2 is B. Run the unit tests and the gallery test again.
4. If a #946 row now fails the "fixed leaves the list" assertion, remove it as D1 says.
5. Run the checks in `AGENTS.md` › Commands, `npm run design:gallery` and `npm run design:check`.
6. Design system steps 2 to 6. The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 (as D3 says) and step 6. The session needs a signed-in account. Step 7 does not apply. The PR stays a draft until then.

## Risks

- **Hidden words.** The `position: absolute` hidden words of the `RelationshipRow` Edit link move their anchor from the row to the link. The link name does not change. `RelationshipRow.test.tsx` checks it.
- **Snapshots.** `position: relative` can change the stacking order. `npm run design:check` shows any change. If a blocking snapshot changes, the build stops for the tech lead.

## Proof

| Acceptance check                                                         | Proven by                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| A point 21px above and below the centre of each ArrowLink is the link    | `e2e/gallery-looks.spec.ts` "keeps a 44px hit area", with the `#944` rows gone |
| The link form has the hit area; the label form has none                  | `ArrowLink.test.tsx`                                                           |
| The look of each ArrowLink state does not change                         | `npm run design:check`; the ArrowLink card images in the gallery job           |
| Each ArrowLink stays a Tab stop with the 2px brand ring                  | `e2e/gallery-looks.spec.ts` "Tab visits each enabled control"                  |
| If D2 is B, each TextLink keeps its hit area, and the disabled text none | `TextLink.test.tsx`; the gallery hit-area test                                 |

## Out of scope

- The other `UNDER_44` Bugs (#947 to #951, #988), and #946 if D1 is B.

## Deviations

- Order of work step 2 did not run: the browser cannot start in the local sandbox. The unit test gave the test-first failure.
- Design system step 4.7 (open the canvas and check the ArrowLink card) did not run in the session.
