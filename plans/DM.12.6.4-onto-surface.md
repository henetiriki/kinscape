# Plan: DM.12.6.4: Layers panel, date dock, Toast and Banner onto Surface

- **Spec:** #199 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

Each root class `composes:` its level from `Surface.module.css`, as Dialog and NoticeCard do, and drops its own `background`, `border-radius` and `box-shadow`. Layers panel and date dock sit at `raised`, Toast at `floating`. Markup and TSX are untouched. Toast keeps its 1px border, which Surface doesn't set. About 60 lines, well under the 600 cap.

## Decisions

**D1 · The Banner** · Decides: Tech lead

The Banner is `--ink` with no shadow; every Surface level is white with a shadow.

- **A.** The Banner stays off Surface. Its radius moves from the shared `.shape` to `.banner`. The Spec's Summary, Behaviour and first check name three.
- **B.** Surface gains an `inverse` level (`--ink`, no shadow) for the Banner. Board 07 doesn't draw it, so the kit doesn't show it.
- **C.** The Banner composes `base` for its radius and keeps its own background; the first check excludes its background. Which wins then depends on CSS order across modules.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How a component is built on Surface** · Decides: Tech lead

- **A.** `composes:` the level class. The panel stays an `aside` and the dock a `section`.
- **B.** Render `<Surface>`, which gains an `as` prop so the markup holds. Changes Surface's API.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What                                                    |
| --------------------------------------------- | ------------- | ------------------------------------------------------- |
| `app/components/LayersPanel.module.css`       | Changed       | `.panel` composes `raised`                              |
| `app/components/DateDock.module.css`          | Changed       | `.dock` composes `raised`                               |
| `app/components/Toast.module.css`             | Changed       | `.toast` composes `floating`; radius to `.banner` (D1A) |
| `app/components/__tests__/onSurface.test.tsx` | New           | Each root carries its level class                       |

## Order of work

1. The three CSS modules (and the Banner per D1).
2. `onSurface.test.tsx`.
3. Design check for `map-desktop`, `style-5-feedback` and `style-5-feedback-phone`, then the AGENTS.md checks.

## Risks

- A later rule overriding a composed property would depend on cross-module CSS order. None of the four overrides background, radius or shadow after the move.
- The dock gains `box-sizing: border-box` from `base`. It has no border or set size, so its box doesn't change; the design check confirms.
- M1.5.3 (#104) reworks the dock on a phone. Whichever merges second rebases; if it rebuilds the dock, this slice shrinks to Toast.

## Proof

| Acceptance check                 | Proven by                                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Built on Surface, no own styling | `onSurface.test.tsx` (level class on each root); the PR pastes a `grep` showing no `background`, `border-radius` or `box-shadow` in the root rules |
| Existing tests pass unchanged    | `git diff --stat origin/main` shows no test or e2e file changed except the new one; `npm test` and `npm run e2e` output                            |
| Design difference does not grow  | Design check scores for the three screens on `main` and on the branch, in the PR                                                                   |
| Tests, e2e, build, 100% coverage | Their output in the PR                                                                                                                             |
