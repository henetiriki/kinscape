# Plan: C806: Check Spec edits for drift before the agent posts them

- **Spec:** #806
- **Status:** approved

## Approach

A new `.github/agent/spec-checks.md` holds the four checks. In `refresh.md`, step 4 keeps its drift rule. It then runs the checks before the one comment of step 5. In `respond.md`, one new bullet applies after the agent edits an issue body. It links to `spec-checks.md` and copies no check. The refresh, plan and respond runs load the file into the system prompt from `main`. A test fails if a run loads `refresh.md` or `respond.md` without it.

## Decisions

**D1 · Where the four checks live** · Decides: Tech lead

A respond run on a PR has a checkout of the PR head. `docs/security.md` says never to read a prompt file from the PR head. Runs load `agent_files` from `main`.

- **A.** A new `spec-checks.md`, loaded by the three runs. This changes three workflows.
- **B.** The checks stay in `refresh.md`. `respond.md` reads them with `git show origin/main:.github/agent/refresh.md`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What                                  |
| --------------------------------------------- | ------------- | ------------------------------------- |
| `.github/agent/spec-checks.md`                | new           | The four checks                       |
| `.github/agent/refresh.md`                    | changed       | Step 4 runs them                      |
| `.github/agent/respond.md`                    | changed       | Run them after a body edit            |
| `.github/workflows/claude-{plan,respond}.yml` | changed       | Load `spec-checks.md`                 |
| `.github/workflows/claude-unblock.yml`        | changed       | Load `spec-checks.md`                 |
| `scripts/__tests__/load-agent-files.test.ts`  | changed       | Pin the lists; fail on a missing load |

## Risks

- `.github/agent/**` and the workflows are hand-back paths. The tech lead builds.
- Issue #806 says no workflow change and names a `word-count.mts` limit. The tech lead edits it.

## Proof

| Done check                                | Proven by                                                           |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Step 4 runs the checks, then one comment  | The diff                                                            |
| `respond.md` runs them and fixes its text | The diff                                                            |
| A run without the file fails              | `npm test -- scripts/__tests__/load-agent-files.test.ts`            |
| Words, lint, format and tests pass        | `npm run words`, `npm run lint`, `npm run format:check`, `npm test` |
| Files in the table only                   | `git diff --stat origin/main`                                       |
