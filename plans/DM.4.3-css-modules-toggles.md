# Plan: DM.4.3: CSS modules: checkbox, chip, segmented control and tabs

- **Spec:** #132 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

As in DM.4.2: cut each control's rules out of `app/controls.css` and paste them, renamed to camelCase, into a `*.module.css` beside the component, keeping selectors, values and order. The shared font and cursor lists split into each module. Checkbox, Chip and Tabs `composes: ring from './focus.module.css'`; Segmented takes its ring as D1 says. Then delete `controls.css`, its import and its tests. The kit rows render the components, so `app/design-kit/page.tsx` needs no change.

## Decisions

**D1 · Segmented focus ring** · Decides: Tech lead
The ring sits on the segment's `<label>` when its radio has focus (`:has(:focus-visible)`), which `.ring` doesn't match.

- **A.** Add `.ringWithin:is(:has(:focus-visible), [data-state='focus'])` to `focus.module.css`, with the same outline; `.segItem` composes it.
- **B.** Widen `.ring` to `:is(:focus-visible, :has(:focus-visible), [data-state='focus'])`; every control composes `ring`.
- **Other:** your own.

Recommended: A, because Button, IconButton and TextLink keep the rule DM.4.2 shipped.

**Answer: A** (@henetiriki)

**D2 · Diff size** · Decides: Tech lead
About 630 changed lines, over the 600 cap: about 590 are the moved CSS, counted once deleted and once added.

- **A.** One PR, as the Spec expects.
- **B.** Split: Checkbox and Chip now; Segmented, Tabs and the deletion in a new Spec.
- **Other:** your own.

Recommended: A, because the move is mechanical and was accepted for DM.4.2.

**Answer: A** (@henetiriki)

## Files that change

| File                                                       | New / changed | What                                                                                        |
| ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `app/components/{Checkbox,Chip,Segmented,Tabs}.module.css` | New           | `.checkbox`; `.chip`; `.seg`, `.segItem`; `.tabs`, `.tab`                                   |
| `app/components/{Checkbox,Chip,Segmented,Tabs}.tsx`        | Changed       | `import styles from './X.module.css'`; `className={styles.…}`                               |
| `app/components/focus.module.css`                          | Changed       | D1; header takes the `[data-state]` note from `controls.css`                                |
| `app/controls.css`                                         | Deleted       |                                                                                             |
| `app/layout.tsx`                                           | Changed       | Drop `import './controls.css'`                                                              |
| `lib/design/__tests__/design.test.ts`                      | Changed       | Drop `controls.css` from the colour-literal list; at least nine modules; new test (Proof)   |
| `e2e/design-kit.spec.ts`                                   | Changed       | Hashed-class test adds Checkbox off, Birth, the Month label and Filters; new arrow-key test |

## Order of work

1. Run `npm run design:check` and keep its differences.
2. Checkbox, Chip, Segmented, Tabs in turn: add the module, switch the component, remove its rules from `controls.css`.
3. D1 in `focus.module.css`.
4. Delete `controls.css` and its import; update `design.test.ts`.
5. Extend the e2e hashed-class test; add the arrow-key test.
6. Lint, format, tests, boundaries, e2e, build, `design:check`.

## Risks

- **Cascade order** between modules: no two modules style the same element, and the radio's `outline: none` is on the input, the ring on the label. `design:check` and the e2e ring test catch a change.
- **`:has()` and descendant `input` selectors in a module:** class-scoped, so allowed; `npm run build` proves it.
- **No arrow-key test exists, and the kit's Segmented is fixed on Year,** so React re-checks Year: the new test asserts that focus moves.
- **Unit tests matching class names:** `classNameStrategy: 'non-scoped'` keeps `chip`, `tab` and so on; `Toggles.test.tsx` selects by role.

## Proof

| Acceptance check                                 | Proven by                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Design check lists the same differences          | `design:check` output before (step 1) and after, in the PR                                                        |
| 44px hit areas                                   | e2e `a small control has a 44px hit area`                                                                         |
| Arrow keys in Segmented; toggle states reported  | New e2e test: ArrowRight on the live Year radio focuses Month; e2e name test; `Toggles.test.tsx`                  |
| `controls.css` gone, nothing imports it          | New `design.test.ts` test: the file doesn't exist and no file under `app`, `lib` or `e2e` contains `controls.css` |
| Modules in use                                   | e2e hashed-class test                                                                                             |
| `npm test` and `npm run e2e` pass, 100% coverage | Their output in the PR                                                                                            |

## Out of scope

- The map screen's styles (DM.4.5).
