# Plan: C691: Add the remaining actions, forms and feedback components to the design system

- **Spec:** #691
- **Status:** draft

## Approach

1. Add the eight to `CONTROLS` and `CARDS`, each at the end of its group.
2. Each card shows the props that change the look. `Banner` leaves out `placed`, which fixes it to the page.
3. The React 18 test checks the `TokenField`, `SelectField`, `Banner` and `NoticeCard` events.

## Decisions

**D1 · The parts that the eight use** · Decides: Tech lead

The Chore names neither `CalloutPointer` nor `RemovableChip`.

- **A.** Add the eight only. `TokenField` draws `RemovableChip`. `DateField` draws the only Callout with its pointer.
- **B.** Also add the two parts: ten components.
- **Other:** your own.

Recommended: A, because a board cannot write the `className` that `CalloutPointer` needs.

## Files that change

| File                                             | What                    |
| ------------------------------------------------ | ----------------------- |
| `lib/design/{bundle,states}.mts`                 | Controls, cards         |
| `lib/design/__tests__/`, `design-system.test.ts` | Cases, counts           |
| `design/canvas/`                                 | Steps 4 and 5           |
| `design/source/`, `design/*.jpg`                 | Render workflow, if any |

## Order of work

1. Add the React 18 cases and counts; see them fail.
2. Do the Approach, then run `npm run design-system`.
3. The tech lead runs steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) in a signed-in session.
4. Run `npm run design:export`. If a board changed, run Design: Render snapshots.

## Risks

A new `bundle.css` rule can change a control on a board, as `Popup` did in #690. `Banner` and the two fields share CSS with `Toast` and `TextField`. `design:export` and the `e2e` design check find it.

## Proof

| Acceptance check                          | Proven by                            |
| ----------------------------------------- | ------------------------------------ |
| Bundle, types, README and card            | `design-system.test.ts`              |
| React 18 renders each state               | `react-18.test.tsx`                  |
| Cards render on the canvas                | The tech lead's screenshot in the PR |
| Under 6 MB                                | `checkScript`                        |
| Hashes, snapshots, tests, lint, typecheck | Output in the PR                     |
