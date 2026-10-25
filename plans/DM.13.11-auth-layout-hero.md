# Plan: DM.13.11: Auth layout and sign-in hero

- **Spec:** #263 (Intent #111)
- **Requirement IDs:** NFR-03, NFR-05, NFR-06, NFR-08
- **Status:** approved

## Approach

Two new parts in `app/components/`; no screen uses them yet (DM.13.8 D3=A).

- **Tokens.** DM.13.8 didn't write the sign-in values. Add `layout.sign-in`: `hero` 560, `pane` 440, `form` 360, `pane-y` `{space.48}`, `pane-x` `{space.32}`, `hero-phone` 188; and, as `sign-in-desktop` draws, `hero-min` 420, `copy` 520, `tagline` 380.
- **`AuthLayout`:** `hero` and `children` slots. Desktop: a wrapping flex row, hero left on `hero` basis, form pane on `pane` basis, padded `pane-y`/`pane-x`, holding a centred column of at most `form`. One `@media` block at `breakpoint` stacks them: a `hero-phone` hero, then the form padded 16. It holds no form logic.
- **`SignInHero`:** the Spec's illustration from the `sign-in-*` sources as `aria-hidden` JSX, coloured from `map.*` as `Legend` is. Then the headline (`display`, `h2`), tagline (`bodyL`) and caption, each phrase after a solid or dashed `aria-hidden` line. The phone snapshot draws no text, so it hides there.

## Decisions

**D1 · How the illustration ships** · Decides: Tech lead

- **A.** Inline SVG in `SignInHero.tsx`: no request, and its label uses the app's fonts.
- **B.** `public/sign-in-hero.svg` in an `<img alt="">`. An SVG image can't load the app's fonts, so the label uses a system font.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The phone crop** · Decides: Tech lead

`sign-in-phone` draws a tighter crop with fewer lines, a larger pin and no label.

- **A.** Two drawings sharing the path data, one per form; the `@media` block shows one.
- **B.** The desktop drawing at both widths, sliced on a phone; the phone hero differs from its snapshot.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Who places the wordmark** · Decides: Tech lead

The desktop wordmark heads the form; the phone one sits over the hero.

- **A.** `AuthLayout` draws both (`Wordmark` 44 above the form slot, 36 over the hero), showing one per form.
- **B.** `AuthLayout` draws the phone one; the sign-in form holds the desktop one.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Proving no cross-origin request** · Decides: Tech lead

No page shows the hero until the sign-in screen Spec.

- **A.** A unit test: the rendered hero holds no `src`, `href` or `url()` that isn't a local `#` id. The sign-in screen Spec adds the e2e request check.
- **B.** An unlisted kit route mounting both parts, with an e2e that records requests.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                 | What                    |
| ---------------------------------------------------- | ----------------------- |
| `design/tokens.json`, `app/tokens.css`               | `layout.sign-in`        |
| `AuthLayout.tsx`, `SignInHero.tsx`, their CSS, tests | New                     |
| `design/DESIGN.md` › Layout                          | The auth layout, a line |

## Order of work

1. Failing tests; tokens and `npm run tokens`.
2. `AuthLayout`, `SignInHero`, `DESIGN.md`.
3. Lint, typecheck, test, validator, e2e.

## Risks

- **Provenance (NFR-08):** the designer says the lines are a hand-drawn sketch, traced from no dataset; the tech lead accepted it. `DESIGN.md` records it.
- **Duplicate SVG ids:** filter and clip ids come from `useId`.
- **Placement unseen:** jsdom computes no CSS, so tests read the stylesheets; the sign-in screen Spec measures it.

## Proof

| Acceptance check                  | Proven by                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| Desktop: hero left, form ≤ 360    | `AuthLayout.test.tsx`: slot order; stylesheet reads `layout-sign-in-*`        |
| Phone: 188 hero, wordmark over it | `AuthLayout.test.tsx`: the `@media` block uses `hero-phone`; wordmark in hero |
| Illustration hidden, text present | `SignInHero.test.tsx`: `aria-hidden`; headline, tagline, caption by text      |
| No cross-origin request           | D4                                                                            |
| Tests, e2e, validator, 100%, 0.5% | Output in the PR                                                              |

## Out of scope

The sign-in screen, its form and error; the Google button; tablet and other hero crops.
