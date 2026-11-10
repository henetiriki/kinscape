# Plan: C691: Add the remaining actions, forms and feedback components to the design system

- **Spec:** #691
- **Status:** approved

## Approach

1. Add the eight, and `RemovableChip` (D1), to `CONTROLS` and `CARDS`, each at the end of its group.
2. Each card shows the props that change the look; `Banner` leaves out `placed`.
3. The React 18 test checks the `TokenField`, `SelectField`, `Banner` and `NoticeCard` events.

## Decisions

**D1 · The parts that the eight use** · Decides: Tech lead

The Chore names neither `CalloutPointer` nor `RemovableChip`.

- **A.** Add the eight only.
- **B.** Also add the two parts: ten components.
- **Other:** your own.

Recommended: A, because a board cannot write `CalloutPointer`'s `className`.

**Answer: other, `RemovableChip` only: nine components** (@henetiriki).

## Files that change

| File                                             | What            |
| ------------------------------------------------ | --------------- |
| `lib/design/{bundle,states}.mts`                 | Controls, cards |
| `lib/design/__tests__/`, `design-system.test.ts` | Cases, counts   |
| `design/canvas/`                                 | Steps 4 and 5   |
| `design/source/`, `design/*.jpg`                 | Render workflow |

## Order of work

1. Add the React 18 cases and counts; see them fail.
2. Run `npm run design-system`.
3. The tech lead runs steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) in a signed-in session.
4. Run `npm run design:export`. If a board changed, run Design: Render snapshots.

## Risks

A new `bundle.css` rule can change a control on a board, as `Popup` did in #690. `design:export` and the `e2e` design check find it.

## Proof

| Acceptance check                          | Proven by                          |
| ----------------------------------------- | ---------------------------------- |
| Bundle, types, README and card            | `design-system.test.ts`            |
| React 18 renders each state               | `react-18.test.tsx`                |
| Cards render on the canvas                | A Chromium render (see Deviations) |
| Under 6 MB                                | `checkScript`                      |
| Hashes, snapshots, tests, lint, typecheck | Output in the PR                   |

## Deviations

- The design agent changed four canvas boards on the tech lead's request. `415812c`.
- Render snapshots changed 16 snapshots and 5 JPGs. It ran `design:export`, because the build session has no Chromium. `409989c`.
- A Chromium render of each preview replaced the canvas screenshot and set the card heights. `db4e45e`.
