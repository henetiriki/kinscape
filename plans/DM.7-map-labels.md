# Plan: DM.7: Map labels on the type board

- **Spec:** #145 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

The `map` group of `design/tokens.json` gains each label's size and tracking beside its colour (Spec D2 A; shape in D1). `app/design-kit/type/page.tsx` gets a `LABELS` table: sample text, token key, and the weight, italic and uppercase the panel draws. Each sample's inline `style` comes from that row and its resolved token; the note under the panel is built from the same rows and `map.label-halo`, so the two cannot disagree. Polity stays 12px (Spec D1 A). The panel and chip take `map.land` and `map.sea`; padding, gap and radius sit in `page.module.css`. No halo, as in the snapshot. `lib/map/style.ts` is unchanged.

## Decisions

**D1 · Shape of the label tokens** · Decides: Tech lead
`contested-label`, `place-label`, `water-label` and `context-label` are colour strings today; rivers share `water-label`'s colour but are 11px, not 13.

- **A.** Each becomes an object like `polity-label`: `{ colour, size, tracking? }`. A new `river-label` is `{ colour: "{map.water-label.colour}", size: 11 }`.
- **B.** Keep the strings; add flat keys such as `place-label-size` and `river-label-size`.
- **Other:** your own.

Recommended: A, as `polity-label` does.

**Answer: A**

**D2 · How the panel reads map tokens** · Decides: Tech lead
`app/tokens.css` leaves out the `map` group.

- **A.** Inline `style` from `resolveTokens(rawTokens)`, as `app/design-kit/feedback/page.tsx` sets the sea.
- **B.** Emit the `map` group as `--map-*` custom properties and use them from `page.module.css`.
- **Other:** your own.

Recommended: A, as the feedback board does.

**Answer: A**

**D3 · Context tracking in the note** · Decides: Tech lead
The board's sample tracks BECHUANALAND PROTECTORATE at 0.12em, but its note leaves that out.

- **A.** The note lists every tracking, so it reads "context 11 italic uppercase, tracking 0.12em"; a few words longer than the board.
- **B.** The note lists tracking for polity and water only, word for word as the board.
- **Other:** your own.

Recommended: A, because a note built from the tokens shouldn't skip one.

**Answer: A**

**D4 · Proving the panel match** · Decides: Tech lead
The whole board scores 2.24%, over the 0.5% threshold.

- **A.** One local run that ignores everything but the old region (72, 1385, 632 × 300); the PR records that score.
- **B.** Add an `only` area list to the check config, so CI scores the region.
- **Other:** your own.

Recommended: A, as DM.6 D5.

**Answer: A**

## Files that change

| File                                          | New / changed | What                                                   |
| --------------------------------------------- | ------------- | ------------------------------------------------------ |
| `design/tokens.json`                          | Changed       | Label sizes and tracking (D1)                          |
| `app/design-kit/type/page.tsx`, `.module.css` | Changed       | `LABELS`, Map labels section, note; drop empty column  |
| `app/design-kit/type/__tests__/page.test.tsx` | Changed       | Five labels and note; mocked water colour reaches chip |
| `e2e/design-kit.spec.ts`                      | Changed       | Each label's computed colour, size, weight, tracking   |
| `design/screens.json`                         | Changed       | `style-1-type` ignores nothing                         |
| `design/DESIGN.md`                            | Changed       | Map style: `map.river-label`; sizes in tokens          |

## Order of work

1. Tokens (D1); `npm run tokens` leaves `app/tokens.css` unchanged.
2. Page, CSS, unit test.
3. `screens.json`, e2e, `DESIGN.md`.
4. Lint, format, words, tests, validator, e2e, build, design check (D4).

## Risks

- Text edges cost pixels: if the panel region misses 0.5%, I stop and report its score and diff to the tech lead.
- Inline `0.15em` computes to px; the e2e test expects `tracking × size` px.

## Proof

| Acceptance check                                   | Proven by                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Five labels and note in token colour, size, weight | e2e on `/design-kit/type` against values read from `tokens.json`; unit test for the texts  |
| Changed `map.water-label` colour reaches the chip  | `page.test.tsx` mocks `tokens.json` with another water colour; INDIAN OCEAN computes to it |
| No ignore region; panel within threshold           | `screens.json` diff; D4 score in the PR                                                    |
| Tests, e2e, validator pass at 100% coverage        | Their output in the PR                                                                     |

## Out of scope

- Drawing place, river, context and water labels on the map, and their glyphs.
