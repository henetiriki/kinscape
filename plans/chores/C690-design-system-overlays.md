# Plan: C690: Add the other overlays to the design system

- **Spec:** #690
- **Status:** approved

## Approach

1. Add the five to `CONTROLS`, with a card each in `Overlays`: `Popup` floating and sheet; `BottomSheet` collapsed and expanded; `Modal`, `Dialog` and `Sheet` open (D1).
2. Give the bundle test page the `showModal` and `matchMedia` stand-ins of `vitest.setup.ts`.
3. Rename the props types that clash in `index.d.ts`.
4. Set `data-size='small'` on the two `DateField` fix buttons and delete the font rules in `.fix`. `Popup` moved `TextLink` after `.fix`, so the link grew to 15px.

## Decisions

**D1 · What the Dialog and Sheet cards show** · Decides: Tech lead

An open modal covers the other states in its card.

- **A.** Also add `DialogPanel` and `SheetPanel`, which draw each form and head in place: seven components.
- **B.** Add only the five. Boards draw the other forms by hand.

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | What                |
| -------------------------------------------------------- | ------------------- |
| `lib/design/{bundle,states}.mts`                         | Controls and cards  |
| `app/components/overlays/{Modal,Dialog,Sheet,Popup}.tsx` | Type names only     |
| `features/map/components/DateField.{tsx,module.css}`     | Item 4              |
| `lib/design/__tests__`, `scripts/__tests__`, `DateField` | Cases, counts, link |
| `design/canvas/`                                         | Steps 4 and 5       |

## Order of work

1. Add the React 18 cases and the `DateField` case; see them fail.
2. Do the Approach, then `npm run design-system`.
3. The tech lead runs steps 3 to 5 in a signed-in session.
4. Compare the hashes; run `npm run design:export`.

## Deviations

- Props types are `*Args`. `cards.test.ts` counts nine Overlays cards.

## Risks

A board with an open modal fails the design check: the export copies no top layer. No board has one.

## Proof

| Acceptance check                      | Proven by                            |
| ------------------------------------- | ------------------------------------ |
| Bundle, types, README and card        | `design-system.test.ts`              |
| React 18 renders each state           | `react-18.test.tsx`                  |
| Cards render on the canvas            | The tech lead's screenshot in the PR |
| Fix link stays 13px                   | `DateField.test.tsx`                 |
| Hashes and "No snapshot changed"      | Output in the PR                     |
| Tests, lint, typecheck, format, words | Output in the PR                     |
