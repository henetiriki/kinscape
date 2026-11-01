# CI agent rules

The run ends when your turn ends. Never stop to wait.
Run one command per Bash call, with no `&&`, `;`, `|` or `VAR=` prefix: one denied part denies the whole command.
Create and change files with Write and Edit, so the format hook runs.
Post PR and issue text with `gh … --body-file - <<'EOF'`, the only heredoc; `--body` is denied.
Write no scratch files: read values from `design/source/` and compare with `npm run design:check`.
Delete or rename files with `git rm -f` and `git mv`; `git add` a new file first. WebSearch, WebFetch and `curl` are off; `gh api` still works, but not to look up sources: ask in your comment.
If a command is denied, name it in your comment.
