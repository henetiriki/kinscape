# Plan: B472: Design system and canvas cards render in a serif fallback, not Public Sans

- **Spec:** #472
- **Requirement IDs:** None (design tooling for Specs #449 and #450)
- **Status:** approved

## Approach

`run` in `scripts/design-system.mts` writes `bundle.css` as `app/tokens.css` plus the controls' CSS, so it sets `--font-body: var(--next-font-public-sans), …` and never defines `--next-font-public-sans`. A new `fontNames(tokens)` in `lib/design/bundle.mts` returns a `:root` block that sets each `fontVariable()` of a `font` token to its first family, quoted, e.g. `--next-font-public-sans: 'Public Sans';`. `run` puts it between the tokens and the controls, so `bundle.css` still starts with `app/tokens.css`. The family names match the `@font-face` rules in the system's `tokens.css`. `next/font` in the app is untouched.

## Decisions

**D1 · Who publishes and refreshes the canvas** · Decides: Tech lead

The Bug's step 4 needs a signed-in, interactive Claude Code session (`/publish-design-system`, then DESIGN.md › Updating the install and Refreshing the copy). An agent in Actions can't run it.

- **A.** The agent pushes the code and tests. You publish, update the install, refresh `design/canvas/` on this branch, and add the Button card screenshots from the design system and the canvas. `Closes #472` then holds when it merges.
- **B.** This PR ships the code only. A follow-up Chore publishes and refreshes. This PR says `Refs #472`, not `Closes`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Preview body font** · Decides: Tech lead

The Bug says the state labels set no font. They have the `small` class, and the system `tokens.css` gives `.small` `font-family: var(--font-body)`, so they turn Public Sans once `--font-body` is valid again.

- **A.** Also set `body { font-family: var(--font-body); }` in `previewHtml`'s style, as the Bug proposes, so any text without a type class is Public Sans too.
- **B.** Leave `previewHtml` alone.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Write `bundle.css`'s font tokens as literal stacks, without `var(--next-font-*)`. The output no longer starts with `app/tokens.css`, and it means a second token renderer.
- Leave the app tokens out of `bundle.css`. The controls need `--type-*` variables, which the system's `tokens.css` doesn't set.

## Files that change

| File                                                          | New / changed | What                                                                      |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| `lib/design/bundle.mts`                                       | Changed       | `fontNames(tokens)`                                                       |
| `lib/design/__tests__/bundle.test.ts`                         | Changed       | `fontNames` gives one line per `font` token, with the first family quoted |
| `scripts/design-system.mts`                                   | Changed       | `bundle.css` is tokens, `fontNames(raw)`, then the controls               |
| `scripts/__tests__/design-system.test.ts`                     | Changed       | Fails if `bundle.css` uses a `--next-font-*` variable it doesn't define   |
| `lib/design/cards.mts`, `lib/design/__tests__/cards.test.ts`  | Changed       | Under D2 A: the body font, and a test for it                              |
| `design/canvas/project/ds/kinscape/`, `design/canvas/VERSION` | Changed       | Under D1 A, by the tech lead: the install and copy after publishing       |

## Order of work

1. Record D1 and D2, then commit `plan(B472): approved by @<tech-lead>`.
2. Write the `design-system.test.ts` check and see it fail on the undefined variable, then `fontNames` with its test, then wire it into `run`.
3. Under D2 A, the `previewHtml` test then the change.
4. Run lint, `format:check`, `words`, the tests, `validate:boundaries` and `e2e`. Push.
5. Under D1 A, ask the tech lead in the PR to publish, refresh the canvas and add the screenshots.

## Risks

- **Publish order:** an install copied before the publish carries the old `bundle.css`. The refresh checks each file's hash against `npm run design-system`.

## Proof

| Acceptance check                                          | Proven by                                           |
| --------------------------------------------------------- | --------------------------------------------------- |
| `bundle.css` defines every `--next-font-*` it uses        | `design-system.test.ts`                             |
| Each variable names the DESIGN.md family                  | `bundle.test.ts`                                    |
| Cards in the design system and canvas use the three fonts | Button card screenshots from both, in the PR (D1 A) |
| Lint, tests (100%), validator and e2e pass                | Their output in the PR                              |

## Out of scope

- The app's `next/font` setup and `app/tokens.css`.
