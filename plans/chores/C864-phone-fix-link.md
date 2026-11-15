# Plan: C864: Swap the phone fix link on Map-phone-states for TextLink

- **Spec:** #864
- **Requirement IDs:** [MAP-03](../../docs/requirements.md#map-03), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

`.textLink:where(button)` gets `min-height: var(--size-touch)`. A `<button>` centres its text, so the 20px line sits in a 44px box. The anchor form keeps its height. `.row > .callout` in `DateField.module.css` takes `padding: var(--space-12) var(--space-16) var(--space-4)` (D4). In step 7, a local session swaps the fix link on `Map-phone-states` for `KinScape.TextLink`, as `SG-Surfaces-2` mounts it.

## Alternatives considered

- Add "44px" to the Text link line of `design/DESIGN.md`: the Touch row already says it.

## Decisions

**D1 · The Feedback phone callout board** · Decides: Tech lead

`style-5-feedback-phone` failed `design:check` at 1.16% (limit 0.5%). `SG-Feedback-phone` has 12px under the link. The app has 4px (issue D4).

- **A.** Edit `SG-Feedback-phone`: padding `12px 16px 4px`.
- ~~**B.** Set the app callout back to 12px.~~
- ~~**C.** Leave it and file a Bug.~~

**Answer: A** (Tech lead)

## Files that change

| File                                         | New / changed | What                                    |
| -------------------------------------------- | ------------- | --------------------------------------- |
| `TextLink.module.css`, `TextLink.test.tsx`   | Changed       | The 44px button form                    |
| `DateField.module.css`, `DateField.test.tsx` | Changed       | The 4px bottom padding                  |
| `design/screens.json`                        | Changed       | The height of a page that grows         |
| `Map-phone-states.dc.html`                   | Changed       | The swap, and a `noop` handler (step 7) |
| `SG-Feedback-phone.dc.html`                  | Changed       | The 4px bottom padding (D1)             |

## Order of work

1. Write the CSS tests, as `ArrowLink.test.tsx` reads its module. See them fail. Change the two modules.
2. Run steps 2 to 7 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5.
3. In step 7, the session swaps only the `date-invalid` fix link on `Map-phone-states`. Tell it that the swap changes pixels on purpose: keep the swap if the export passes. The callout keeps its padding.
4. The tech lead runs Design: Render snapshots. These snapshots change:
   - `style-5-feedback`, `style-5-feedback-phone`
   - `style-7-components-surfaces-2`, `style-7-components-surfaces-2-phone`
   - `add-pin`, `add-pin-phone` (D3)
   - `map-date-invalid-phone`
5. Run `npm run design:check` on the six screens of the done check.

## Risks

- The Surfaces kit sample of the phone callout keeps 12px under the link, as `SG-Surfaces-2` does. The map callout has 4px. The Constraints keep that board. A follow-up Chore can align the two.
- The issue Constraints name only `Map-phone-states`. D1 adds `SG-Feedback-phone`. The tech lead updates the Constraints of the issue.
- A page that grows can push content past its `screens.json` height. Step 5 shows it; raise the height to the board's.

## Proof

| Acceptance check                  | Proven by                                      |
| --------------------------------- | ---------------------------------------------- |
| The board mounts `TextLink`       | `git grep` on `Map-phone-states.dc.html`       |
| Same type and hit area; 4px       | The two CSS tests; one component on both sides |
| `design:check` on the six screens | Step 5 output                                  |
| Steps 2 to 7; sha256 match        | Steps 4.6 and 5.2                              |
| `design:export`                   | Its output after the Render workflow           |
