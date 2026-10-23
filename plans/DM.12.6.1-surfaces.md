# Plan: DM.12.6.1: Surface, Notice card, Progress bar and Callout

- **Spec:** #185 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** draft

## Approach

- **Surface:** one class per level in `Surface.module.css` for other modules to `composes:`; `Surface` renders a `div` with `level`.
- **Notice card:** `title`, the line as children, optional `icon`, `actions` typed `[Action] | [Action, Action]` (first primary). `role="status"`, no `tabIndex`. `progress` gives the loading form: Progress bar named by the title, `aria-live="polite"`.
- **Progress bar:** `value` clamped to 0–100, `aria-labelledby`. The fill eases only under `prefers-reduced-motion: no-preference`, as Sheet does.
- **Callout:** `Callout` is the box (`role="alert"`, `id`, floating level); `CalloutPointer` is the `aria-hidden` span. The date field renders both in place of its own.
- **Kit page:** `/design-kit/surfaces`, "Style guide · 07" after Inputs, reusing `inputs/Board.tsx` and its `?part=2` phone split: part 1 Surface, Notice card, Progress bar; part 2 Callout, as the phone snapshots split them.

## Decisions

**D1 · The sheet level** · Decides: Tech lead

Board 07 draws four levels; the Spec names three.

- **A.** Add `sheet` (top corners 18, `shadow.sheet`); the Spec's Surface line gains it.
- **B.** Three; the kit draws the sheet in plain CSS.

Recommended: A, because the check asks for every variant drawn.

**D2 · The large Notice card** · Decides: Tech lead

Board 07 draws a large form (28 icon on top, H3 title, 380 wide); the Spec doesn't name it.

- **A.** Build it as `size="large"`; the Spec's Notice card line gains it.
- **B.** Leave it to the empty-tree screen Spec; the check excludes it.

Recommended: A: it reuses every part.

**D3 · Button height on a phone** · Decides: Tech lead

The card's buttons are 40 on desktop, 44 on a phone.

- **A.** The card renders Button S, or M under the phone breakpoint or with `phone` (the kit's phone sample).
- **B.** `actions` is a `ReactNode`; callers pick sizes.

Recommended: A, because the card then owns the sizes board 07 measures.

**D4 · Placing the Callout's pointer** · Decides: Tech lead

- **A.** The caller places `CalloutPointer`; the date field keeps it on the field.
- **B.** `Callout` takes `pointerAt`; the date field measures the field after layout.

Recommended: A: no measuring, and the phone pointer e2e stays unchanged.

**D5 · The date field's callout look** · Decides: PO

Today's look is board 05's: padding 10 12, 13.5px, raised shadow. Board 07 and `map-date-invalid` draw padding 12, 13/20, floating shadow.

- **A.** Board 07's look everywhere; the check reads "looks as board 07 draws it".
- **B.** Today's look in the date field; only the kit shows board 07's.

Recommended: A, because the newer boards agree.

**D6 · Progress bar easing** · Decides: Tech lead

- **A.** `motion.popup` (160ms ease-out).
- **B.** Never eases.

Recommended: A, the shortest ease.

## Files that change

| File                                                        | New / changed | What                        |
| ----------------------------------------------------------- | ------------- | --------------------------- |
| `app/components/` Surface, NoticeCard, ProgressBar, Callout | New           | Components, CSS, tests      |
| `app/components/DateField.tsx`, `.module.css`               | Changed       | Onto Callout                |
| `app/design-kit/surfaces/`                                  | New           | Page, sections, CSS, test   |
| `app/design-kit/boards.ts` and its menu tests               | Changed       | Board 07 row                |
| `e2e/surfaces.spec.ts`                                      | New           | Motion, sizes, roles, 390px |

## Order of work

1. Components, with tests.
2. Date field onto Callout.
3. Kit page, e2e, then the AGENTS.md checks and design check.

## Risks

- Needs DM.12.5 (#196, open): the build rebases on `main` once it merges.
- The phone e2e finds the pointer by `class*="pointer"`; the class keeps that name.

## Proof

| Acceptance check          | Proven by                                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| Every variant, in order   | Page test of section and variant order; design check scores in the PR           |
| Loading form              | `NoticeCard.test.tsx`: `aria-live`, progressbar name, `aria-valuenow` rerenders |
| `role="status"`, no focus | Test: role, no `tabIndex`; e2e: Tab goes from before the card to its button     |
| Reduced motion            | e2e with `reducedMotion: 'reduce'`: the fill's `transition-duration` is `0s`    |
| Date field callout        | `DateField.test.tsx` and `controls-phone.spec.ts` pass unchanged                |
| Tests, e2e, build         | Their output in the PR                                                          |
