# Plan: DS.5: The shared controls work under React 18

- **Spec:** #448
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

`react-18@npm:react@18.3.1` and `react-dom-18@npm:react-dom@18.3.1` join the dev dependencies (Spec D1: A). `vitest.config.mts` gets two `test.projects`: `react-19`, today's suite, and `react-18`, which runs only `lib/design/__tests__/react-18.test.tsx` with `react` and `react-dom` aliased to those packages. The project inlines `@testing-library/react` and `react-dom-18` (`server.deps.inline`) so their own `react` imports take the alias too. `npm test` runs both, with one coverage report. The test spies on `console.error` and `console.warn` and fails if either is called, in a case named `<Control> · <state>`. A control that fails is fixed in its own file, with its existing test passing on 19.

## Decisions

**D1 · Where the React 18 states come from** · Decides: Tech lead

- **A.** A table in the test: each control with the props for each state its boards show (`states` columns default, hover, focus, pressed, disabled; the variants on `inputs`, `feedback`, `colour`, `surfaces`). A failure names the control; the table can fall behind a board.
- **B.** Render the board pages themselves under React 18. Nothing to keep in step, but a failure names the board, and non-D3 controls on them (`TextLink`, `Callout`) come into scope.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · `ChipGroup` has no board** · Decides: Tech lead

It's used only in `FilterFields`; acceptance check 1 asks for its design kit states.

- **A.** Render it as the `inputs` board's event chips: some on, some off. Check 1 reads "its design kit states (`ChipGroup`: its chips' states)".
- **B.** Render it with the cases in `ChipGroup.test.tsx`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                     | New / changed | What                                                                                  |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`      | Changed       | The two aliased dev dependencies                                                      |
| `vitest.config.mts`                      | Changed       | `react-19` and `react-18` projects; the first excludes the React 18 test              |
| `lib/design/__tests__/react-18.test.tsx` | New           | Version check, then each control's states (D1, D2) and main interaction               |
| A D3 control that fails                  | Changed       | Fixed in place so 18 and 19 both pass; one line per control under Deviations          |
| `docs/architecture.md`                   | Changed       | Patterns row: the D3 controls run on React 18 and 19, enforced by `react-18.test.tsx` |

## Order of work

1. The test's first case expects `React.version` and `ReactDOM.version` to start `18.` and renders a hook; see it fail on `19.3.1` (rule 12), then add the dependencies and projects.
2. Each control's states, then its interaction, as the Spec lists: click `Button`, `IconButton`, `Chip`, `ChipGroup`, `Segmented`; type in `TextField`; tick `Checkbox`, `CheckboxField`; ArrowRight moves focus and selection in `Tabs`; Enter on `1652-13-01` in `DateField` shows its alert; Esc and the action dismiss `Toast`; `Alert` renders only. Each expects what that control's existing test expects.
3. Fix any failing control; rerun its test.
4. The architecture row; the checks.

## Risks

- **Two Reacts.** If an externalised package resolves `react` itself, hooks break with "Invalid hook call". The step 1 case catches it; if inlining isn't enough, Vite's dependency optimiser (`deps.optimizer`) applies the alias when it bundles them.
- **18.3 deprecation warnings** (`ReactDOMTestUtils.act`) from Testing Library would fail every case. Testing Library 16 uses `React.act` when React has it, as 18.3 does; a warning naming no control is a big departure (rule 6).
- **A fix changes the look:** the design check catches it.

## Proof

| Acceptance check                          | Proven by                                     |
| ----------------------------------------- | --------------------------------------------- |
| Each state renders, no error or warning   | `react-18.test.tsx` state cases               |
| Main interaction behaves as its test does | `react-18.test.tsx` interaction cases         |
| Changed controls pass under 19, 100%      | `npm test` (both projects) output in Evidence |
| Lint, format, words, e2e, design check    | Their output in Evidence                      |

## Out of scope

- Bundling the controls (DS.6); controls outside D3.
