# Plan: C690: Add the other overlays to the design system

- **Spec:** #690
- **Status:** approved

## Approach

1. Add the seven to `CONTROLS` (D1), with a card each in `Overlays`.
2. Share the `vitest.setup.ts` stand-ins through `__tests__/dom-stand-ins.ts`.
3. Rename the props types that clash in `index.d.ts`.
4. Set `data-size='small'` on the two `DateField` fix buttons and delete the font rules in `.fix`.
5. Move `CHAIN` and `PINS` to `lib/design/samples.mts`; the kit imports them.

## Decisions

**D1 · What the Dialog and Sheet cards show** · Decides: Tech lead

An open modal covers the other states in its card.

- **A.** Also add `DialogPanel` and `SheetPanel`, which draw each form and head in place.
- **B.** Add only the five.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                | What                       |
| ------------------------------------------------------------------- | -------------------------- |
| `lib/design/{bundle,states,samples}.mts`                            | Controls, cards            |
| `app/components/overlays/{Modal,Dialog,Sheet,Popup}.tsx`            | Type names only            |
| `DateField`, `data.ts`, `vitest.setup`, tests                       | Items 2, 4 and 5           |
| `design/canvas/`                                                    | Steps 4 and 5, `Map-phone` |
| `design/source/{add-pin*,map-phone-collapsed}.html`, `design/*.jpg` | Render workflow            |

## Order of work

1. Add the React 18 and `DateField` cases; see them fail.
2. Do the Approach, then `npm run design-system`.
3. The tech lead runs steps 3 to 5, then `npm run design:export`.

## Deviations

- Props types are `*Args`. `cards.test.ts` counts nine Overlays cards.
- Item 4 undoes a 15px fix link that `Popup` caused. The `Add-pin` snapshots change, so `design:export` does not print "No snapshot changed". Four map JPGs differ by render noise (#690).
- The design agent put `BottomSheet` in the collapsed date sheet of `Map-phone`. Its snapshot markup changes; its pixels do not.

## Risks

A board with an open modal fails the design check. No board has one.

## Proof

| Acceptance check                          | Proven by                            |
| ----------------------------------------- | ------------------------------------ |
| Bundle, types, README and card            | `design-system.test.ts`              |
| React 18 renders each state               | `react-18.test.tsx`                  |
| Cards render on the canvas                | The tech lead's screenshot in the PR |
| Fix link stays 13px                       | `DateField.test.tsx`                 |
| Hashes, snapshots, tests, lint, typecheck | Output in the PR                     |
