# Plan: C1155: Require a reason on every eslint-disable, and remove the act and children-prop disables

- **Chore:** #1155
- **Requirement IDs:** None: test tooling
- **Status:** approved

## Approach

A local session adds `@eslint-community/eslint-plugin-eslint-comments` 4.8.1 as a pinned devDependency ([D2](#decisions)). The CI build then does these steps:

- **Lint.** `eslint.config.mjs` imports `comments` from `@eslint-community/eslint-plugin-eslint-comments/configs`. A new block spreads `comments.recommended`, with no `files` key, and adds `'@eslint-community/eslint-comments/require-description': 'error'`.
- **Reasons.** Each of the 6 disables gets its reason after `--`. The build deletes the comment line above it. `Modal.tsx:32` stays, because it tells why the dialog has an `onClick`. Only `:33` moves. The `eslint-enable` of `dom-stand-ins.ts:22` follows [D1](#decisions).
- **Link.** `link.ts` calls `createElement(LinkContext.Consumer, null, (Link: LinkComponent) => createElement(Link as ElementType, props))`. The disable and its comment go.
- **Act.** `submit()` and `save()` only click. Each caller then waits for the first state that its next check reads, with `findBy…` or `waitFor`. If that state can exist before the click, the caller waits for a state that only the click makes. The "Try again" click and the empty `act` follow the same rule. An `act` import that has no more use goes.

## Decisions

**D1 · The reason of the `eslint-enable` line** · Decides: Tech lead

`require-description` checks each directive, `eslint-enable` too, unless its `ignore` option names it. `dom-stand-ins.ts:22` holds `/* eslint-enable no-restricted-syntax */`, with no reason. #1155 step 3 moves the reason of the block, but it does not say what the `eslint-enable` gets. Related issue #1157 holds no value for this. How does the build make lint pass?

- **A.** Set the rule to `['error', { ignore: ['eslint-enable'] }]`. Cost: 1 config line. An `eslint-enable` then never needs a reason.
- **B.** Give the `eslint-enable` a reason, such as `-- the methods end here`. Cost: 1 line. Each later `eslint-enable` then needs a reason too.
- **C.** Replace the block with an `eslint-disable-next-line` on `close` and on `showModal`, each with the reason. Cost: 4 changed lines. This breaks the Constraint "Change only the place of their reason".
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · When the package lands on the branch** · Decides: Tech lead

The approving review starts the CI build at once ([building](../../docs/building.md#specs-bugs-and-chores)). The build cannot add a package (`npm install` is off). Without the package, the build cannot do steps 2 and 3 of #1155, or show the lint failure that the done list asks for.

- **A.** Before the approving review, the tech lead's local session adds the package to this branch. It pushes `package.json` and `package-lock.json`. The CI build then builds every other row. Cost: one local step before approval.
- **B.** Approve first. The CI build does steps 4 and 5 and writes a "Big:" line for the package. Then a local session does steps 1 to 3. Cost: two build sessions, and the CI build cannot check the done list.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A JSX child for the Consumer in `link.ts`: the file is `.ts`, so it has no JSX. The third argument of `createElement` is the same child.
- `waitForElementToBeRemoved` for the empty `act`: it fails if the dialog is gone before the call. `PersonRelationships.test.tsx:513` uses `waitFor` with `queryByRole`, so the build uses that form.

## Files that change

| File                                                                | New / changed | What                                                                                               |
| ------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `package.json`                                                      | Changed       | Local session: `@eslint-community/eslint-plugin-eslint-comments`, exact version                    |
| `package-lock.json`                                                 | Changed       | Local session: the package and its dependencies                                                    |
| `eslint.config.mjs`                                                 | Changed       | The `comments.recommended` block and `require-description` (D1)                                    |
| `__tests__/dom-stand-ins.ts`                                        | Changed       | `:13`: the reason of `:12` after `--`; `:22` as D1 says                                            |
| `app/components/overlays/Menu.tsx`                                  | Changed       | `:81`: the reason of `:80` after `--`                                                              |
| `app/components/overlays/Modal.tsx`                                 | Changed       | `:34`: the reason of `:33` after `--`                                                              |
| `app/components/overlays/PinPopup.tsx`                              | Changed       | `:150`: the reason of `:149` after `--`                                                            |
| `app/components/overlays/Popup.tsx`                                 | Changed       | `:123`: the reason of `:122` after `--`                                                            |
| `features/map/components/__tests__/MapView.test.tsx`                | Changed       | `:74`: the reason of `:73` after `--`                                                              |
| `app/components/foundation/link.ts`                                 | Changed       | The Consumer's function is the third argument; remove the disable and its comment                  |
| `app/components/auth/__tests__/SignInForm.test.tsx`                 | Changed       | `submit()` only clicks; its 6 callers wait for their next state                                    |
| `features/people/components/__tests__/PersonForm.test.tsx`          | Changed       | `save()` only clicks; its 15 callers and the "Try again" click wait for their next state; no `act` |
| `features/people/components/__tests__/PersonRelationships.test.tsx` | Changed       | `:527`: `waitFor` on the absence of the dialog, in place of the empty `act`                        |
| `plans/chores/C1155-eslint-disable-reasons.md`                      | New           | This plan                                                                                          |

## Order of work

1. Local session (tech lead), before the approving review if D2 is A:
   - Run `npm install --save-dev --save-exact @eslint-community/eslint-plugin-eslint-comments`.
   - Push `package.json` and `package-lock.json` to this branch.
2. CI build: record the `npm test` test count in the PR.
3. CI build: change `eslint.config.mjs`. Move the 6 reasons, and apply D1.
4. CI build: show the lint failure. Do not stage the temporary line, because the pre-commit hook lints each staged file.
   - Add `// eslint-disable-next-line no-console` with no reason to a file.
   - Run `npm run lint`, and paste the failure in the Evidence.
   - Remove the line.
5. CI build: change `link.ts`. Run `link.test.tsx`.
6. CI build: change the `act` lines, one test file per commit. Run each changed test file 3 times, to see a wait that passes by chance.
7. CI build: run the done-check grep of [Proof](#proof). Then run the checks of [Verifying your work](../../AGENTS.md#verifying-your-work).

## Risks

- `import/no-unresolved` can fail to resolve the `/configs` subpath. Then the build uses the path that the package `exports` field gives, and writes a line under Deviations.
- A wait can end before the save ends. Then a later state update runs outside `act`, and React logs a warning. The build reads the `npm test` output for an `act` warning from the 3 changed files, and fixes the wait of each one.
- For a caller that checks that nothing happened (`expect(create).not.toHaveBeenCalled()`), a wait on the error text proves that the save ran. The error text is a check that the test already reads.
- `react/no-children-prop` can still report a function child that the third argument gives. The rule reads only a `children` key, so the build expects no report.

## Proof

| Acceptance check                                                                          | Proven by                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `package.json` pins `@eslint-community/eslint-plugin-eslint-comments` to an exact version | The `package.json` diff                                       |
| `npm run lint` fails on a temporary disable with no `--` reason                           | The lint output of step 4, in the Evidence                    |
| `git grep "react/no-children-prop\|testing-library/no-unnecessary-act"` finds no disable  | The grep output in the PR                                     |
| `npm run lint` and `npm test` pass, with the same test count                              | The `npm run lint` and `npm test` output; the count of step 2 |

## Deviations

- A local session added the package after the CI build, not before the approving review (D2). It then did steps 3 (config) and 4.
- `link.ts` casts the function child to `ReactNode`, because the types of `createElement` take a node as a child.

## Out of scope

- The other Testing Library disables: #1157 and later Chores change them.
- The arrow-function selector in `eslint.config.mjs`.
