# Plan: DM.6: Alerts, toasts and banner

- **Spec:** #117 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** draft

## Approach

`Alert` takes `tone` (error, warning, success, info), `title` and one line; error is `role="alert"`, the rest `role="status"`. `Toast` takes `tone` (success, error), the message, an optional `action` with `onAction`, and `onDismiss`. `Banner` takes an icon, the message and one action, and shares the toast's 48px shape in `Toast.module.css` with an `--ink` fill and `--focus-ring-on-dark`. `Icon` gains `success`, `info`, `cloudOff` and a `filled` 20px form (a disc with a white mark) for alerts. A toast rises in with `--motion-popup` only under `prefers-reduced-motion: no-preference`. The board renders them as drawn, with each `role=` label placed by the board's CSS.

## Decisions

**D1 · How an error toast is dismissed** · Decides: Tech lead
The board draws no close button.

- **A.** Esc inside the toast, or pressing its action; the owner can also call `onDismiss`.
- **B.** A 36px close `IconButton` after the action; the check reports the difference until it is designed.
- **Other:** your own.

Recommended: A, because it adds no undesigned UI.

**D2 · Who removes a success toast** · Decides: Tech lead

- **A.** `Toast` calls `onDismiss` after `motion.toast` (4000ms); the owner removes it. The board passes none, so it stays for the check.
- **B.** `Toast` hides itself; the design check fakes timers on this board.
- **Other:** your own.

Recommended: A, as DM.5 D4 did for the date notice.

**D3 · Where toasts and the banner are placed** · Decides: Tech lead

- **A.** Unplaced here; the map Spec that first shows one places it above the dock or top centre.
- **B.** Add a fixed `ToastRegion` and `BannerRegion` now, unused until a screen mounts them.
- **Other:** your own.

Recommended: A, because the dock's height belongs to the map screen.

**D4 · How a toast leaves** · Decides: Tech lead
Foundations give popups a 160ms fade and 4px rise; leaving isn't drawn.

- **A.** It rises in and leaves at once.
- **B.** It also fades out, staying mounted 160ms after `onDismiss`.
- **Other:** your own.

Recommended: A, because it is simpler.

**D5 · Proving the board match** · Decides: Tech lead
The whole board scores 7.42% today (Form fields, DM.5 D5), over the 0.5% threshold.

- **A.** One local run that ignores everything but Alerts and Toasts; the PR records that score. `screens.json` drops both ignore regions.
- **B.** Add an `only` area list to the check config, so CI scores the regions.
- **Other:** your own.

Recommended: A, because B is a tooling change outside this Spec.

## Files that change

| File                                                    | New / changed | What                                      |
| ------------------------------------------------------- | ------------- | ----------------------------------------- |
| `app/components/Icon.tsx`                               | Changed       | `success`, `info`, `cloudOff`, `filled`   |
| `app/components/Alert.tsx`, `.module.css`, test         | New           | Four tones, roles                         |
| `app/components/Toast.tsx`, `.module.css`, test         | New           | Two tones, timer, Esc, action, rise       |
| `app/components/Banner.tsx`, test                       | New           | Ink fill, one action, white ring          |
| `app/design-kit/feedback/page.tsx`, `.module.css`, test | Changed       | Alerts column; Toasts and banners section |
| `design/screens.json`                                   | Changed       | `style-5-feedback` ignores nothing        |
| `e2e/design-kit.spec.ts`                                | Changed       | Banner ring; reduced motion               |
| `design/DESIGN.md`                                      | Changed       | Drop "not built yet"                      |

## Order of work

1. `Icon`, `Alert`; tests.
2. `Toast`, `Banner`; tests.
3. Board, `screens.json`, e2e, `DESIGN.md`.
4. Lint, tests, validator, e2e, design check (D5).

## Risks

- About 550 changed lines, near the 600 cap.
- The board draws alert marks as text; SVG marks may differ slightly.

## Proof

| Acceptance check                         | Proven by                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Alerts, toasts and banner match          | Design check (D5)                                                                 |
| Success leaves at 4s; error stays        | `Toast` test, fake timers: 3999ms vs 4000ms; error kept after 60s; Esc, action    |
| Error announced at once, status politely | `Alert`, `Toast`, `Banner` tests: error is `role="alert"`, others `role="status"` |
| Banner action's ring is white            | e2e: Tab to Retry, outline colour is white                                        |
| Reduced motion, no slide                 | e2e: `reducedMotion: 'reduce'`, the toast's `animation-name` is `none`            |

## Out of scope

- Where each screen uses them (screen Specs).
