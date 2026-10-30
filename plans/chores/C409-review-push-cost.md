# Plan: C409: Review only what changed since the last review

- **Spec:** #409
- **Status:** approved

## Approach

Each push reran the full review, hunting new gaps: #405 had six. A new step in `claude-code-review.yml` writes the diff since the head of the PR's last successful review run into the checkout. `review.md` then flags defects only on lines in both it and `gh pr diff`, and lists gaps no committed file reaches in one comment. `claude_args` drops `--model opus`.

## Decisions

**D1 · Scope after the first review** · Decides: Tech lead

- **A.** The step above; no prior run or a failed call means a full review.
- ~~**B.** `review.md` only: the reviewer guesses from the commit list.~~

**Answer: A** (@henetiriki)

**D2 · Input-dependent gaps** · Decides: Tech lead

- **A.** One summary comment per review.
- ~~**B.** Not reported (the command's filter).~~

**Answer: A** (@henetiriki)

**D3 · `--model opus`** · Decides: Tech lead

- ~~**A.** Keep: it sets the main agent, which alone sees `review.md`.~~
- **B.** Drop: the plugin's bug and validation agents already use Opus.

**Answer: B** (@henetiriki)

## Files that change

| File                                       | What                                    |
| ------------------------------------------ | --------------------------------------- |
| `.github/workflows/claude-code-review.yml` | Since-last-diff step; no `--model opus` |
| `.github/agent/review.md`                  | `## Findings`                           |

## Risks

- A merge from `main` widens the diff; the both-diffs rule filters it.
- Without Opus the main agent may miss plan or rule breaks; the proof PR plants one.
- Unchanged code's defects that earlier rounds missed go unflagged (#405's last run: one of three).

## Proof

| Acceptance check                        | Proven by                  |
| --------------------------------------- | -------------------------- |
| Second push: findings on new lines only | A synthetic PR after merge |
| Gaps in one note; cost below #405's     | The same PR's run pages    |
| A planted plan departure is still found | The same PR                |
| Lint, format, words                     | Their output               |

**Hand back:** both files are code-owned; the tech lead builds this.

## Deviations

- The job gains `actions: read` for `gh run list`.
- `review.md` drops its style-nit line (the command has one) for its budget.
