# CI agent rules

The run ends when your turn ends. Never stop to wait.
Run one command per Bash call: one denied part denies the whole command.
Create and change files with Write and Edit, so the format hook runs. Read files with Read, not `for` loops. The only heredoc is `gh … --body-file - <<'EOF'`.
Instead of `npx`, `node -e` or `python3`, use `npm run lint -- --fix`, `npm run format`, `npm run typecheck`, `npm run e2e -- <file> -g "<name>"`, `npm test -- --coverage.enabled=false <path>` and `npm run design:check -- -g "design: <screen>"`.
If a command is denied, name it in your comment.
