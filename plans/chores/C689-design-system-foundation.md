# Plan: C689: Add the foundation components and Menu to the design system

- **Spec:** #689
- **Status:** approved

## Approach

1. Copy the card states into the React 18 test. React 18 warns when `Menu` gives `Avatar` a `ref`: see it fail.
2. `Menu` will find the Avatar through its anchor, and close to it in React 18 too.
3. Add the components and cards, in new groups `Foundation` and `Overlays`, named after their folders.
4. Give `Text` the JSDoc summary its README needs.

## Decisions

**D1 · How a board gets the open Menu** · Decides: Tech lead

A `Menu` card shows it closed only. Spec #684 draws it open, with one item highlighted.

- **A.** Also add `MenuPanel`, which draws the open card and a hovered item: eight components.
- **B.** Add only `Menu`. Boards draw the open card by hand.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The Wordmark logo on the canvas** · Decides: Tech lead

A canvas page does not serve `/icon0.svg`, which `Wordmark` loads.

- **A.** The bundle build replaces that path with a data URL (10 KB), and fails if the path is gone.
- **B.** Change nothing. The canvas shows a broken image.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                    | What                    |
| ----------------------------------------------------------------------- | ----------------------- |
| `lib/design/{bundle,states,cards}.mts`, `types.ts`                      | Controls, cards, groups |
| `scripts/design-system.mts`                                             | D2                      |
| `app/components/overlays/Menu.tsx`, `foundation/Text.tsx`               | Steps 2 and 4           |
| `docs/architecture.md`                                                  | The controls row        |
| `lib/design/__tests__/{react-18,bundle,cards}`, `design-system.test.ts` | Cases and counts        |

## Risks

- About 450 changed lines, under the 600 cap.
- The canvas can block data URLs. If it does, raise a Bug.

## Proof

| Acceptance check                      | Proven by                                   |
| ------------------------------------- | ------------------------------------------- |
| A README and card each                | `design-system.test.ts`                     |
| React 18 renders each state           | `react-18.test.tsx` `states` and `previews` |
| Under 6 MB                            | `checkScript`                               |
| The app does not change               | The component tests pass unchanged          |
| Tests, lint, typecheck, format, words | Output in the PR                            |
