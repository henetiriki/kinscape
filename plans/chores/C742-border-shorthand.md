# Plan: C742: Drop the border-colour shorthand case from design export

- **Spec:** #742
- **Status:** approved

## Approach

jsdom 31 and Chromium list only longhand names when code reads a style declaration, so `border-color` never reaches the check in `inlineStyles`. Make the side group in the regex required, and read the one side's width directly:

```ts
const side = /^border-(top|right|bottom|left)-color$/.exec(name);
const undrawn =
  (side && computed.getPropertyValue(`border-${side[1]}-width`) === '0px') ||
  (name === 'outline-color' &&
    computed.getPropertyValue('outline-style') === 'none');
```

The existing `inlineStyles` tests cover each remaining branch, so no test changes. The comment on `inlineStyles` does not name the shorthand. The Divider and MenuPanel test runs real component CSS and proves the output is unchanged.

## Decisions

**D1 · How to read the side's width** · Decides: Tech lead

- **A.** Read `border-${side[1]}-width` directly.
- **B.** Keep `[side[1]].every(each => …)`, as the issue says.
- **Other:** your own.

Recommended: A, because a one-item `.every()` adds a callback and does nothing else.

**Answer: A** (tech lead)

## Files that change

| File                                    | New / changed | What                                           |
| --------------------------------------- | ------------- | ---------------------------------------------- |
| `scripts/design-export.mts`             | changed       | Required side group; read the one side's width |
| `plans/chores/C742-border-shorthand.md` | new           | This plan                                      |

## Order of work

1. Merge `origin/dependabot/npm_and_yarn/jsdom-31.0.0` into the worktree branch. A push to PR #726's branch is then a fast-forward.
2. Commit this plan.
3. Change `scripts/design-export.mts`. Commit.
4. Run the checks in `AGENTS.md` › _Verifying your work_, with `vitest` as `--coverage.enabled=false`. CI proves coverage.
5. Push to PR #726 and add `Closes #742` to its body, after the tech lead agrees.

## Risks

- Dependabot can rebase the branch and drop these commits. If it does, push them again.

## Proof

| Acceptance check                     | Proven by                                |
| ------------------------------------ | ---------------------------------------- |
| `npm test` passes with 100% coverage | CI `test` and `coverage` jobs on PR #726 |
| Lint, typecheck, format, words pass  | CI jobs                                  |
| No file in `design/source/` changes  | PR diff                                  |
