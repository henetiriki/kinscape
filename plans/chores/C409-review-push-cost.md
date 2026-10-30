# Plan: C409: Review only what changed since the last review

- **Spec:** #409
- **Status:** approved

## Approach

Each push reruns the full review, which hunts for new hypothetical gaps (`review.md` line 28): #405 had six. A new step in `claude-code-review.yml` writes `gh api compare <sha>...<head>` into the checkout, `<sha>` being the head of the PR's last successful review run. `review.md` `## Findings`: when that file exists, report defects only on lines in both it and `gh pr diff`; check the plan against the whole PR. Gaps no committed file's input reaches go in one summary comment. `claude_args` drops `--model opus`.

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

- A merge from `main` widens the compare; the both-diffs rule filters it out.
- Without Opus the main agent may miss plan or rule breaks; the proof PR includes one.

## Proof

| Acceptance check                        | Proven by                  |
| --------------------------------------- | -------------------------- |
| Second push: findings on new lines only | A synthetic PR after merge |
| Gaps in one note; cost below #405's     | The same PR's run pages    |
| A planted plan departure is still found | The same PR                |
| Lint, format, words                     | Their output               |

**Hand back:** both files are in `.github/CODEOWNERS`; the tech lead builds this locally.
