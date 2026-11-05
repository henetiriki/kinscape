# Sourced by setup-github.sh and check-github.sh: the logins whose comments the agents read.

# Print the logins of the repo's write collaborators (owner included), sorted and comma separated,
# as the repo variable KINSCAPE_TEAM_LOGINS holds them. Fails with no output if it finds none, so
# an unreadable list can't be set as "nobody".
team_logins() { # repo
  local logins
  logins=$(gh api "repos/$1/collaborators?per_page=100" \
    --jq '[.[] | select(.permissions.push) | .login] | sort | join(",")') || return 1
  [ -n "$logins" ] || return 1
  printf '%s\n' "$logins"
}
