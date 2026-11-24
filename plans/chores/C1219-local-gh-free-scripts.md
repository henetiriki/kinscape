# Plan: C1219: Local gh-free scripts, failed checks in fix-review, rename plan:approve

- **Spec:** #1219
- **Status:** approved

## Approach

A new module, `scripts/gh-fetch.mts`, serves the three `gh` call shapes that `review-threads.mts` and `plan-new.mts` make, with `fetch` and `GH_TOKEN`. The `Gh` port is synchronous and `fetch` is not, so each call runs `node scripts/gh-fetch.mts <gh args>` as a child process (D1). That child prints what `gh` prints and fails as `gh` fails, so the two `run` functions and their tests do not change. Two thin entry files pass this `Gh` to the existing `run` functions (D2). The CI scripts keep their `gh` adapter. The prompt and skill edits, the rename and the word budget (D3) are text changes with `load-agent-files.test.ts` lines. One row, `.claude/skills/fix-review-local/SKILL.md`, is a hand-back path. The tech lead builds that row, and the CI agent builds the others.

## Decisions

**D1 · How a synchronous `Gh` gets a `fetch` result** · Decides: Tech lead

The `Gh` type in `scripts/types.ts` returns a string, and `fetch` returns a promise.

- **A.** Run each call in a child `node scripts/gh-fetch.mts <gh args>`. The child prints the reply. A failed reply goes to stderr as `gh: <message> (HTTP <status>)`, with exit code 1. Cost: one node start per call (about 100 ms; `list` makes two or three calls).
- **B.** Run `fetch` in a worker thread and wait with `Atomics.wait` on a `SharedArrayBuffer`. Cost: about 30 more lines, and the 404 error shape for `plan-new.mts` must be built by hand.
- **C.** Make `Gh` return a promise, and make both `run` functions and `ghList` async. Cost: `hand-back.mts`, `pr-checks.mts` and the other `ghList` callers change too, with each of their tests. CI runs that code.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the `:local` scripts pick the adapter** · Decides: Tech lead

- **A.** Two new entry files, `scripts/review-threads-local.mts` and `scripts/plan-new-local.mts`. Each imports `run` and passes the fetch `Gh`. Cost: `plan-new-local.mts` repeats the 10 lines of `files` and `git` wiring from the `plan-new.mts` main block.
- **B.** The main block of each existing script picks the fetch `Gh` when `KINSCAPE_GH=fetch` is set. The npm script sets it. Cost: the files that CI runs change, in code that `v8 ignore` hides from the tests.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The word budget of `fix-review.md`** · Decides: Tech lead

`.github/agent/fix-review.md` is near its budget of 460 words (`scripts/word-count.mts`). Item 4 adds about 70 words.

- **A.** Raise the budget to 540. Change the row in `scripts/__tests__/word-count.test.ts` too.
- **B.** Keep 460 and cut about 70 words from the other text of the file. Cost: a rewrite of rules that the tests in `load-agent-files.test.ts` pin.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The run's own pending checks** · Decides: Tech lead

`gh pr checks <n>` lists the jobs of `claude-fix-review.yml` that run the fix. They are always pending, so item 4 names them in each final comment.

- **A.** Keep item 4 as the Chore says. Each final comment names the `Fix review` jobs as pending.
- **B.** Add one sentence: "Skip the checks named `Fix review`: they are this run." Cost: the build rewords "Skip a pending check" in #1219.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- Put a `gh` shim that calls `gh-fetch.mts` first on `PATH`. A shell `PATH` prefix in an npm script does not work on each shell. The shim also cannot set `GH_REPO` for `review-threads.mts`.

## Files that change

| File                                         | New / changed | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/gh-fetch.mts`                       | New           | `ghFetch(args, input, deps)`, async: `api graphql -f query=… [-f\|-F k=v]…` posts to `/graphql` (`-F` makes a number) and throws on `errors`; `api [--paginate] <path> [--jq '.[] \| @json']` gets the path with `{owner}/{repo}` filled, follows `Link: rel="next"` and prints one JSON value per line; `issue view <n> --json <fields>` maps the REST issue (`type` → `issueType`, `html_url` → `url`). Other args throw. A non-2xx reply throws `gh: <message> (HTTP <status>)`. `repoOf(url)` reads `https://github.com/o/r(.git)` and `git@github.com:o/r(.git)`. `localGh(env, git, exec)` returns the message "Set GH_TOKEN …" when `GH_TOKEN` is empty, or the sync `Gh` and the repo. Its `import.meta.main` block is the child of D1 A. |
| `scripts/__tests__/gh-fetch.test.ts`         | New           | A fake `fetch` and a fake `exec`, no `gh`: each call shape, pages, `-F`, a GraphQL `errors` reply, a 404, an unknown call, both remote forms, a missing `GH_TOKEN`. The token is in no error text (security rules).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `scripts/review-threads-local.mts`           | New           | Exits 1 with the `localGh` message, or calls `run` with `GH_REPO` from `repoOf`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `scripts/plan-new-local.mts`                 | New           | The same for `plan-new.mts` `run`, with the `files` and `git` deps (D2 A).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `scripts/types.ts`                           | Changed       | `GhFetchDeps`: `fetch`, `token`, `repo`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `package.json`                               | Changed       | `review:threads:local` and `plan:new:local`, each `NODE_USE_ENV_PROXY=1 node scripts/<name>-local.mts`; `plan-approve` → `plan:approve`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `scripts/approve-plan.mts`                   | Changed       | Both usage lines say `plan:approve`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `scripts/__tests__/approve-plan.test.ts`     | Changed       | The usage test checks the full `Usage: plan:approve <plan file> ` text, not only `Usage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `.github/agent/build.md`                     | Changed       | "Don't run `plan:approve`."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.github/agent/fix-review.md`                | Changed       | Under _The findings_: run `gh pr checks <n>`; each failed check on the head is a finding, with its log read as `rules.md` says; skip a pending check (D4); change no code for a failure that code cannot fix. Step 6 names each pending check and each failure for a person. The file keeps no `gh api` text.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `.claude/skills/fix-review-local/SKILL.md`   | Changed       | One override: run `npm run review:threads:local` for `list`, `reply` and `resolve`. Delete the `GH_REPO=` line and the `gh api graphql` sentence; keep "Reply on a thread in one line. For a fixed thread, say what changed."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `plans/README.md`                            | Changed       | "A local Claude Code session runs `npm run plan:new:local -- <n> <slug>` itself." replaces the hand-over sentence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts/word-count.mts`                     | Changed       | `fix-review.md` budget 540 (D3 A).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts/__tests__/word-count.test.ts`       | Changed       | The `fix-review.md` row says 540.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | `fix-review.md` holds `gh pr checks <n>`, the pending rule and the failure rule. The skill holds `npm run review:threads:local` and no `GH_REPO=` and no `gh api graphql`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Order of work

1. Test first: `gh-fetch.test.ts` and the new `load-agent-files.test.ts` lines fail.
2. `gh-fetch.mts` and the type.
3. The two entry files and the npm scripts.
4. The rename: `package.json`, `approve-plan.mts`, `build.md`. `git grep -n "plan-approve" -- ":!plans"` finds nothing. `npm run plan:approve` with no arguments prints the `plan:approve` usage line.
5. `fix-review.md`, the skill, `plans/README.md` and the budget.
6. On this PR, run `npm run review:threads -- list <n>` and `npm run review:threads:local -- list <n>`. Run `npm run plan:new -- 1219 local-gh-free-scripts` and `npm run plan:new:local -- 1219 local-gh-free-scripts`. Paste both pairs in the PR Evidence. If the run has no `GH_TOKEN`, ask the tech lead to run them in a sandboxed local session.
7. The checks in [Verifying your work](../../AGENTS.md#verifying-your-work).

## Risks

- `gh issue view --json` and the REST issue can differ in a field. `plan-new.mts` reads only `body`, `issueType.name`, `title` and `url`, and the tests pin that mapping.
- A `GH_TOKEN` in an error message leaks it. Error text holds only the status and the API's `message`, and a test checks it.
- `GH_TOKEN` lives in the tech lead's shell. It is no Vercel or GitHub secret, so no row goes into `infrastructure.md`.

## Proof

| Acceptance check                                                            | Proven by                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `review:threads:local -- list <n>` prints the same JSON as `review:threads` | Order of work step 6, in the PR Evidence; `gh-fetch.test.ts`   |
| `plan:new:local -- <n> <slug>` prints the same output as `plan:new`         | Step 6, in the PR Evidence; `gh-fetch.test.ts`                 |
| No `GH_TOKEN`: each `:local` script exits 1 and names `GH_TOKEN`            | `gh-fetch.test.ts` (`localGh`); step 6 with the variable unset |
| Unit tests cover the adapter with no `gh` call; 100% coverage               | `gh-fetch.test.ts`; `npm test`                                 |
| `fix-review.md` and `fix-review-local`: `gh pr checks`, pending, infra      | `load-agent-files.test.ts`                                     |
| `npm run plan:approve -- …` works; no `plan-approve` outside `plans/`       | `approve-plan.test.ts`; `git grep` in step 4                   |
| Each check in Verifying your work passes                                    | Step 7 output in the PR                                        |

## Out of scope

- Other scripts that call `gh` (`hand-back.mts`, `pr-checks.mts`, `agent-*.mts`).
- Old plans that name `plan-approve`.
- Workflow and Claude settings files.

## Deviations

- The tech lead built the hand-back row `.claude/skills/fix-review-local/SKILL.md` in eec2192.
- Step 6 of `fix-review.md` is unchanged. The new bullets under _The findings_ tell the agent to name each pending check and each failure for a person in the final comment.
- `scripts/gh-fetch.mts` also exports `execText`. Both entry files share this child-process wrapper.
- The review added four unlikely cases to `gh-fetch.mts`: a null issue body, a call with no `--paginate`, a `-F` value that is not a number, and an `ssh://` or missing `origin`.
