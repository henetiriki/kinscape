# Plan: B821: Screens scroll sideways or overlap at phone and tablet widths

- **Spec:** #821 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05)
- **Status:** draft

## Approach

A global `box-sizing: border-box` rule stops the People `.content` overflow. `NoticeCard`'s `.card` gets `max-width: 100%`. Each listed board's phone query moves to the new token `breakpoint.desktop-width` (1279.98px). The glyph grid gets `max-width: 100%`. A new e2e check covers each `design/screens.json` route except `fuzzy-date-readings`.

Boards that take the phone layout below 1280px (issue D1 B): `states`, `type`, `map-style` (the Bug); `map-furniture`; `inputs` (shares its module); likely `feedback` and `surfaces`.

Under D2 B, each kit element that fails its snapshot gets `content-box`. The build also fixes three overflows that remain: `inputs` at 1440px, `foundations` and `surfaces` at 320px.

## Decisions

**D1 · The kit header and kit bar on a board that takes the phone layout** · Decides: Tech lead

- **A.** Only the board's module switches. The shared header and the kit bar stay desktop from 640px.
- **B.** The board's `main` gets `data-narrow`, and `kit.module.css` gives its header the phone form there too.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The global `box-sizing` rule** · Decides: Tech lead

With the rule, `npm run design:check` fails 13 blocking screens.

- **A.** Drop the rule. Only the People `.content` gets `border-box`.
- **B.** Keep the rule. Each failing element gets `content-box`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                                  | New / changed | What                                                                                                          |
| ----------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `design/tokens.json`, `app/tokens.css`                | changed       | `breakpoint.desktop-width`; `npm run tokens`                                                                  |
| `lib/design/__tests__/design.test.ts`                 | changed       | The media query test accepts `desktop-width` (max) and + 0.02 (min)                                           |
| `app/globals.css`                                     | changed       | `*, ::before, ::after { box-sizing: border-box; }`                                                            |
| `app/components/feedback/NoticeCard.module.css`       | changed       | `.card` has `max-width: 100%`                                                                                 |
| `app/design-kit/<board>/page.module.css`              | changed       | Each listed board's queries use `desktop-width`; `content-box` on failing elements; the three overflows       |
| `app/design-kit/map-furniture/page.module.css`        | changed       | `.glyphGrid` has `max-width: 100%`                                                                            |
| `e2e/widths.spec.ts`                                  | new           | The width check and the cases in Proof                                                                        |
| `e2e/design-kit.spec.ts`                              | changed       | "map style keeps its column headers" checks the phone layout; `states` and `type` at 800 × 900 are one column |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Design system steps 3 to 5                                                                                    |

## Order of work

1. Write `e2e/widths.spec.ts`. Run it on `main` and see it fail. Record each failing board under Deviations.
2. Add the token and run `npm run tokens`. Change the media query test.
3. Add the global rule and the `NoticeCard` rule. Run `npm run design:check`. Set `content-box` on each failing element.
4. Change the board queries and the glyph grid. Fix the three overflows.
5. Change `e2e/design-kit.spec.ts`.
6. Run the checks in `AGENTS.md` › Commands and `npm run design:check`.
7. Run `npm run design-system` (step 2). Push. Ask the tech lead, or a local session that they start, to run steps 3 to 5. The PR stays a draft until then.

## Risks

- The check can find a product screen that scrolls sideways at 768 to 1279px. No design covers it. The build stops for the tech lead.

## Proof

| Acceptance check                                                    | Proven by                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| No sideways scroll at six widths and at 667 × 375                   | `e2e/widths.spec.ts`                                                                                                 |
| `map-furniture` at 1366, glyph grid inside its board                | `e2e/widths.spec.ts`                                                                                                 |
| Blocking snapshots pass, including `style-8-components-map` at 1440 | `npm run design:check`                                                                                               |
| Empty People card centred at 375                                    | `e2e/widths.spec.ts` on `/screens/people-empty`                                                                      |
| Large `NoticeCard` in a 320px container                             | `e2e/widths.spec.ts`: a 320px parent at 1440 wide                                                                    |
| `states`, `type`, `map-style` one column at 800                     | `e2e/design-kit.spec.ts`                                                                                             |
| `colour`, `foundations` desktop at 800 × 900                        | `e2e/design-kit.spec.ts`, unchanged                                                                                  |
| The token and the media query test                                  | `lib/design/__tests__/design.test.ts`                                                                                |
| #104, #801, #803, #155                                              | `e2e/design-kit.spec.ts` 390 and 800 × 450; `e2e/people.spec.ts`; `people-*` snapshots; `e2e/controls-phone.spec.ts` |
| `NoticeCard` kit sample at 358                                      | `style-7-components-surfaces-phone` snapshot; `NoticeCard.test.tsx`                                                  |
| `e2e/design-kit.spec.ts` finds controls by role                     | That spec                                                                                                            |

## Out of scope

- A tablet design for product screens.
- Side gutters on People and the Person form from 640 to 1087px.

## Deviations
