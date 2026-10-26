# Plan: B297: Change glyphs for events

- **Spec:** #297
- **Requirement IDs:** PIN-03, NFR-06
- **Status:** approved

## Approach

`EVENT_GLYPHS` in `EventGlyph.tsx` is the only place the app draws a glyph, so changing it updates every chip, Legend row, pin row and kit board. The new characters are birth `*` U+002A, marriage `∞` U+221E, death `†` U+2020, baptism `~` U+007E, burial `⚰` U+26B0 and other `•` U+2022. The DESIGN.md table and the HTML snapshots that draw glyphs change with it, so `design:check` still passes. The Design agent shots workflow then renders the JPGs. `U+FE0E` stays, because `⚰` and `▪` have emoji forms.

## Decisions

**D1 · Removing land and occupation, adding divorce** · Decides: PO

PIN-03 lists land ownership and occupation and no divorce. Requirements change only through an Intent.

- **A.** This Bug changes the six glyphs and D2 only. Land `□` and occupation `▲` stay. You file an Intent to change PIN-03, and a later Spec removes those two and adds divorce `%` U+0025.
- **B.** This Bug does all of it: eight Event types, and the kit's "nine" becomes "eight". You file an Intent for PIN-03 alongside, and the PR waits for it.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · Residence glyph** · Decides: PO

The issue says to keep `▪` U+25AA, but today's glyph is `■` U+25A0.

- **A.** Change it to `▪` U+25AA, the smaller square.
- **B.** Keep `■` U+25A0.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                 | New / changed | What                                                                          |
| ---------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `app/components/map/EventGlyph.tsx`                                                                  | Changed       | New characters; the `TEXT_FORM` comment names `⚰` and `▪`                     |
| `app/components/map/__tests__/EventGlyph.test.tsx`                                                   | Changed       | Pins each Event type's code point                                             |
| `app/design-kit/map-furniture/sections.tsx`                                                          | Changed       | Shapes and Font facts no longer name the old pairs or the old fallback glyphs |
| `app/design-kit/map-style/Preview.tsx`                                                               | Changed       | The glyph sample `●■◆✚` uses the new characters                               |
| `design/DESIGN.md`                                                                                   | Changed       | Event glyphs table                                                            |
| `design/source/style-6-*`, `style-7-components-surfaces-2*`, `style-8-*`, `map-style*`, `map-*.html` | Changed       | The same character swaps, and the reworded facts                              |
| `design/*.jpg`                                                                                       | Changed       | Rendered by the Design agent shots workflow, not by hand                      |
| Under D1 B: `inputs/sections.tsx`, `map-furniture/sections.tsx` and their tests                      | Changed       | Drop land and occupation, add divorce; "nine" becomes "eight"                 |

## Order of work

1. Record D1 and D2, then commit `plan(B297): approved by @<tech-lead>`.
2. Write the code-point test so it fails, then change `EventGlyph.tsx`.
3. Make the kit and DESIGN.md changes, then the snapshot swaps. Run `design:check` on the four boards and on map style.
4. Push, then run `gh workflow run design-agent-shots.yml --ref bug/B297-event-glyphs`.
5. Run lint, the tests, the validator, `npm run e2e` and `npm run words`.

## Risks

- **Font coverage:** Public Sans has no `⚰`, and may have no `▪`. The build checks which new characters fall back and lists them in the Font fact. If the pinned Playwright image draws one as a missing-glyph box, stop and ask.
- **Emoji:** some systems may still draw `⚰` as an emoji. `U+FE0E` asks for text form, and a phone screenshot in the PR shows how it looks.
- **Map pins:** pins aren't built yet. Their SDF icons will follow DESIGN.md when they are.

## Proof

| Check                                        | Proven by                                                  |
| -------------------------------------------- | ---------------------------------------------------------- |
| Each Event type draws the issue's code point | `EventGlyph.test.tsx`                                      |
| Kit boards match their snapshots             | `npm run design:check`                                     |
| `/design-kit/map-furniture` shows the glyphs | Preview check by the PO; desktop and phone shots in the PR |
| Lint, tests (100%), validator and e2e pass   | Their output in the PR                                     |

## Deviations

- `map-furniture/page.module.css`: the glyph grid has 8 columns, not 9.
- The kit's chip row has three on, not four, since Land (on) is gone.
- `docs/requirements.md` changed at @henetiriki's request, with Intent #302 for @starforms to review: PIN-03 lists the eight Event types; the range-pin text moves from EXP-01 to a new EXP-09 (Could), which EXP-01 no longer carries.
- EXP-09 keeps "land ownership": @henetiriki will add it back if it becomes a requirement. Its milestone is open for #302.

## Out of scope

- Map pin SDF icons.
