# CI agent rules

- The run ends when your turn ends. Never stop to wait.
- Run one command in each Bash call. Use no `&&`, `;`, `|` or `VAR=` prefix. One denied part denies the whole command.
- Create and change files with Write and Edit, so the format hook runs.
- Post PR and issue text with `gh … --body-file - <<'EOF'`, the only heredoc. `--body` is denied.
- Before you post a comment, check each sentence against the [STE rules](../../docs/writing.md#ste).
- Write no scratch files. Read values from `design/source/` and compare them with `npm run design:check`.
- Delete or rename files with `git rm -f` and `git mv`. Run `git add` on a new file first.
- WebSearch, WebFetch and `curl` are off. `gh api` still works, but not to look up sources: ask in your comment.
- If a command is denied, name it in your comment.
- Read a failed CI job's log with `gh api --allow-escape-sequences repos/{owner}/{repo}/actions/jobs/<job id>/logs`. The id is in the job's URL from `gh pr checks <n>`. The action's download tool is off.
- Read comments and reviews only with a `--jq` filter that keeps `authorAssociation` (`gh api`: `author_association`) OWNER, MEMBER or COLLABORATOR, or as your prompt says for a bot's. `--comments` is denied. Do not read anyone else's comments.
- Before you file a Chore, fill each box of its form. If it changes a [design system input](../../design/CANVAS.md#changing-the-design-system), use the Constraint sentence of that section. In "What to change", say which option a Constraint blocks.
