# Plan: C375: Old plans are history, kept out of searches

- **Spec:** #375
- **Status:** draft

## Approach

`AGENTS.md` › Plans tells agents to read `plans/README.md`, `plans/TEMPLATE.md` and their own plan, and to open other plans only to learn why something was done. `rules.md` line 5 becomes: search with `git grep '<pattern>' -- ':!plans'`, because old plans name paths that no longer exist; read your own plan by path.

## Decisions

**D1 · Fitting the `AGENTS.md` sentence** · Decides: Tech lead

`AGENTS.md` has about 7 words free (estimate); the full sentence adds about 17.

- **A.** Fold it into the Plans paragraph's "Before you draft" sentence, and cut the "Tool-agnostic" line, which `CLAUDE.md` already says for Claude.
- **B.** Add only `TEMPLATE.md`, "your own plan" and "Other plans are history." (about 8 words); drop "open one only to learn why".
- **Other:** your own.

Recommended: A, because it keeps the whole rule and removes a repeated fact.

## Files that change

| File                                     | New / changed | What                         |
| ---------------------------------------- | ------------- | ---------------------------- |
| `AGENTS.md`                              | Changed       | Plans: old plans are history |
| `.github/agent/rules.md`                 | Changed       | `git grep` excludes `plans`  |
| `plans/chores/C375-old-plans-history.md` | New           | This plan                    |

## Order of work

Edit both files as D1 says; run `words`, lint and `format:check`.

## Risks

- `rules.md` loads from `main`, so only runs after merge use it.
- An agent looking for why something was done gets no plan hits from `git grep`; the `AGENTS.md` sentence still lets it open a plan by path.

## Proof

| Acceptance check                                                   | Proven by                                 |
| ------------------------------------------------------------------ | ----------------------------------------- |
| `git grep` calls exclude `plans`; the agent opens its plan by path | Transcript of the first build after merge |
| `AGENTS.md` ≤ 700, `rules.md` ≤ 300; `words`, lint, `format:check` | Output in the PR                          |

## Out of scope

A `Read(plans/**)` deny and a cap on `plans/`.
