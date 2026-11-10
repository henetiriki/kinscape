# Plan: C690: Add the other overlays to the design system

- **Spec:** #690
- **Status:** approved

## Approach

1. Add the five to `CONTROLS`, and a card each in `Overlays`: `Popup` floating and sheet, with the design kit's synthetic pins; `BottomSheet` collapsed and expanded; `Modal`, `Dialog` (`form: 'centred'`) and `Sheet` open (D1).
2. Give the bundle test's jsdom page the `showModal` and `matchMedia` stand-ins of `vitest.setup.ts`.
3. Rename the props types that clash in `index.d.ts`. `Chip` and `Toast` already bring `EventGlyph` and `tokens.json` for `usePhone`.

## Decisions

**D1 · What the Dialog and Sheet cards show** · Decides: Tech lead

An open modal fills the card from the top layer and covers the other states.

- **A.** Also add `DialogPanel` and `SheetPanel`, which draw each form and head in place: seven components.
- **B.** Add only the five. Boards draw the other forms by hand.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | What                    |
| -------------------------------------------------------- | ----------------------- |
| `lib/design/{bundle,states}.mts`                         | Controls and cards      |
| `app/components/overlays/{Modal,Dialog,Sheet,Popup}.tsx` | Type names only         |
| `lib/design/__tests__/{react-18,bundle}`                 | Cases, names, stand-ins |
| `scripts/__tests__/design-system.test.ts`                | Count                   |
| `design/canvas/`                                         | Steps 4 and 5           |

## Order of work

1. Add the React 18 cases; see the bundle test fail.
2. Do the Approach.
3. Step 2: `npm run design-system`.
4. The tech lead runs steps 3 to 5 in a signed-in session.
5. Compare the hashes; run `npm run design:export`.

## Deviations

- Props types in four files are `*Args`. `cards.test.ts` counts nine Overlays cards.

## Risks

The export copies no top layer or `::backdrop`, so a board with an open modal fails the design check. No board has one.

## Proof

| Acceptance check                      | Proven by                            |
| ------------------------------------- | ------------------------------------ |
| Bundle, types, README and card        | `design-system.test.ts`              |
| React 18 renders each state           | `react-18.test.tsx`                  |
| Cards render on the canvas            | The tech lead's screenshot in the PR |
| Under 6 MB                            | `checkScript`                        |
| Hashes and "No snapshot changed"      | Output in the PR                     |
| Tests, lint, typecheck, format, words | Output in the PR                     |
