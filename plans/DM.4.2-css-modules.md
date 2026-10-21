# Plan: DM.4.2: CSS modules: convention, buttons, link and kit page

- **Spec:** #131 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** draft

## Approach

Cut the `.btn*`, `.icon-btn*`, `.text-link*` and `.kit*` rules out of `app/controls.css` and paste them, renamed to camelCase, into a `*.module.css` beside each owner. The rules keep their selectors, values and order, so the kit looks the same. `app/components/focus.module.css` has one `.ring:is(:focus-visible, [data-state='focus'])` rule; `.btn`, `.iconBtn` and `.textLink` `composes: ring from './focus.module.css'`. The shared lists in `controls.css` (font, cursor, focus) drop the moved classes and keep Checkbox, Chip, Segmented and Tabs. Vitest gets `css.modules.classNameStrategy: 'non-scoped'` (Spec D1). The e2e spec finds live cells by role and `[inert]`, not by class.

## Decisions

**D1 · Diff size** · Decides: Tech lead
The diff is about 700 changed lines, over the 600 cap: about 540 are the moved CSS, counted once as deleted and once as added.

- **A.** One PR, as the Spec expects.
- **B.** Split: buttons and link now; the kit page module in its own Spec.
- **Other:** your own.

Recommended: A, because the move is mechanical and a split leaves `controls.css` in a third mixed state.

## Files that change

| File                                                     | New / changed | What                                                                           |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `app/components/focus.module.css`                        | New           | `.ring`                                                                        |
| `app/components/{Button,IconButton,TextLink}.module.css` | New           | `.btn`, `.btnPrimary`, `.btnSecondary`; `.iconBtn`; `.textLink`                |
| `app/components/{Button,IconButton,TextLink}.tsx`        | Changed       | `import styles from './X.module.css'`; `className={styles.…}`                  |
| `app/design-kit/page.module.css`                         | New           | The `.kit*` rules as `.kit`, `.kitRow`, `.kitCell`, …                          |
| `app/design-kit/page.tsx`                                | Changed       | `styles.…` class names                                                         |
| `app/controls.css`                                       | Changed       | Moved rules removed; shared lists trimmed                                      |
| `vitest.config.mts`                                      | Changed       | `css.modules.classNameStrategy: 'non-scoped'`                                  |
| `app/components/__tests__/Button.test.tsx`               | Changed       | Expect `btn btnSecondary`                                                      |
| `app/design-kit/__tests__/page.test.tsx`                 | Changed       | `.kitCell`, `.kitRow`, `.btnPrimary` selectors                                 |
| `lib/design/__tests__/design.test.ts`                    | Changed       | Scan `globSync('app/**/*.module.css')` too; `controls.css` has no moved class  |
| `e2e/design-kit.spec.ts`                                 | Changed       | No class selectors; new hashed-class test                                      |
| `docs/building.md`                                       | Changed       | One rule: a module per component, camelCase names, `composes` for shared rules |

## Order of work

1. Run `npm run design:check` and keep its differences.
2. Add `focus.module.css` and `Button.module.css`; switch `Button`; `npm run build` to prove cross-file `composes` works.
3. IconButton, TextLink, then the kit page; trim `controls.css` after each.
4. Vitest config and unit tests; colour-literal and `controls.css` checks.
5. e2e: live controls are `getByRole('figure', { name: 'State matrix' })` › `:is(button, input, a):not([inert] *)`; the Month segment is `label` with text Month. Add a test that the live Sign in, Zoom in and Attributions controls each have a class token containing `btnPrimary`, `iconBtn` or `textLink` and none equal to it.
6. `docs/building.md` rule.
7. Lint, format, tests, boundaries, e2e, build, `design:check`.

## Risks

- **Turbopack and `composes` across files:** step 2 proves it first. If it fails, stop and return to the Spec's D3.
- **Cascade order changes** between a module and `controls.css`: no selector targets both, and each module keeps its source order; `design:check` and the e2e ring test catch a change.
- **The colour-literal glob matches nothing:** the test asserts it finds at least five modules.

## Proof

| Acceptance check                                                      | Proven by                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Design check lists the same differences                               | `design:check` output before (step 1) and after, in the PR                    |
| 100% coverage; Button, IconButton, TextLink tests pass                | `npm test` output                                                             |
| Colour-literal test scans `controls.css`, `globals.css`, every module | Its test names list each module path                                          |
| Focus order, names, 44px hit areas, 2px ring; no class selectors      | `npm run e2e`; `grep -nE "locator\('[^']*\." e2e/design-kit.spec.ts` is empty |
| Hashed class names; no moved rule in `controls.css`                   | The new e2e test; the `controls.css` check in `design.test.ts`                |

## Out of scope

- `e2e/smoke.spec.ts` still selects `.credits` and the MapLibre canvas: map screen, DM.4.5.
