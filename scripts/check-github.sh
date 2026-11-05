#!/usr/bin/env bash
# Check that GitHub's live settings match what scripts/setup-github.sh applies.
# Read-only. Exits non-zero if anything has drifted. A setting only a repo admin can read prints
# 🔒 when the token isn't an admin's; that is not drift.
set -uo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
fail=0 locked=0
NEEDS_ADMIN='needs admin'
ADMIN=$(gh api "repos/$REPO" --jq '.permissions.admin // false' 2>/dev/null)

# gh, with an HTTP 403 answered as "needs admin" (keeping gh's exit code), so it reads as 🔒 not ❌.
g() {
  local err out rc
  err=$(mktemp)
  out=$(gh "$@" 2>"$err")
  rc=$?
  if [ $rc -ne 0 ] && grep -q 'HTTP 403' "$err"; then out=$NEEDS_ADMIN; fi
  rm -f "$err"
  printf '%s' "$out"
  return $rc
}
# A read only an admin may make: without an admin's token, "needs admin" and no call, as GitHub
# answers some of these with 404 or a null field rather than 403.
a() { if [ "$ADMIN" == "true" ]; then g "$@"; else printf '%s' "$NEEDS_ADMIN"; return 1; fi; }

# Read a value from a ruleset file: a node expression over the parsed JSON `j`.
j() { # file, expression
  node -e "const j = JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); console.log($2)" \
    "$DIR/github/$1" 2>/dev/null
}
CHECKS='j.rules.filter((r) => r.type === "required_status_checks").flatMap((r) => r.parameters.required_status_checks.map((c) => c.context + "@" + (c.integration_id ?? ""))).sort().join(",")'
BYPASS='(j.bypass_actors || []).map((b) => b.actor_type + ":" + b.actor_id + ":" + b.bypass_mode).join(",")'
RULE_TYPES='j.rules.map((r) => r.type).sort().join(",")'

check() { # description, actual, expected
  if [[ "$2$3" == *"$NEEDS_ADMIN"* ]]; then echo "🔒 $1: needs admin"; locked=$((locked + 1))
  elif [ "$2" == "$3" ]; then echo "✅ $1"
  else echo "❌ $1: is '$2', expected '$3'"; fail=1; fi
}

r() { g api "repos/$REPO" --jq "$1"; }
check "Squash merge allowed"           "$(r .allow_squash_merge)" "true"
check "Merge commits disabled"         "$(r .allow_merge_commit)" "false"
check "Rebase merge disabled"          "$(r .allow_rebase_merge)" "false"
check "Squash title = PR title"        "$(r .squash_merge_commit_title)" "PR_TITLE"
check "Squash body = commit messages"  "$(r .squash_merge_commit_message)" "COMMIT_MESSAGES"
check "Delete branch on merge"         "$(r .delete_branch_on_merge)" "true"
check "Suggest updating PR branches"   "$(r .allow_update_branch)" "true"
check "Auto-merge allowed"             "$(r .allow_auto_merge)" "true"
check "Issues on"                      "$(r .has_issues)" "true"
check "Wiki off"                       "$(r .has_wiki)" "false"
check "Projects off"                   "$(r .has_projects)" "false"
check "Discussions off"                "$(r .has_discussions)" "false"
policies=$(g api graphql -f query='{ repository(owner: "'"${REPO%/*}"'", name: "'"${REPO#*/}"'") { issueCreationPolicy pullRequestCreationPolicy } }' \
  --jq '.data.repository | "\(.issueCreationPolicy) \(.pullRequestCreationPolicy)"')
check "Issue creation: collaborators"  "${policies% *}" "COLLABORATORS_ONLY"
check "PR creation: collaborators"     "${policies#* }" "COLLABORATORS_ONLY"

# The labels setup-github.sh creates, and no other.
source "$DIR/github/labels.sh"
check "Labels" "$(g label list --repo "$REPO" --limit 100 --json name,color,description --jq '.[] | "\(.name)|\(.color | ascii_downcase)|\(.description)"' | LC_ALL=C sort)" \
  "$(labels | awk -F'|' 'BEGIN { OFS = "|" } { $2 = tolower($2); print }' | LC_ALL=C sort)"

ids=$(g api "repos/$REPO/rulesets" --jq '.[] | select(.name=="Protect main") | .id')
id=$(printf '%s\n' "$ids" | head -n1)
if [ -z "$id" ]; then
  echo "❌ Ruleset 'Protect main' missing"; fail=1
else
  check "Single 'Protect main' ruleset" "$(printf '%s\n' "$ids" | wc -l | tr -d ' ')" "1"
  q() { g api "repos/$REPO/rulesets/$id" --jq "$1"; }
  pr='.rules[] | select(.type=="pull_request") | .parameters'
  check "Ruleset active"                    "$(q .enforcement)" "active"
  check "Ruleset targets default branch"    "$(q '.conditions.ref_name.include | join(",")')" "~DEFAULT_BRANCH"
  check "Block deletion"                    "$(q '[.rules[].type] | index("deletion") != null')" "true"
  check "Block force push"                  "$(q '[.rules[].type] | index("non_fast_forward") != null')" "true"
  check "Linear history"                    "$(q '[.rules[].type] | index("required_linear_history") != null')" "true"
  check "PR required, 1 approval"           "$(q "$pr | .required_approving_review_count")" "1"
  check "Stale approvals dismissed"         "$(q "$pr | .dismiss_stale_reviews_on_push")" "true"
  check "Last push needs approval"          "$(q "$pr | .require_last_push_approval")" "true"
  check "Extra approval, unattributed changes" "$(q "$pr | .require_extra_approval_for_unattributed_changes")" "true"
  check "Branches must be up to date"       "$(q '.rules[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy')" "true"
  check "Code-owner review required"        "$(q "$pr | .require_code_owner_review")" "true"
  check "Conversations must be resolved"   "$(q "$pr | .required_review_thread_resolution")" "true"
  check "Squash only in ruleset"            "$(q "$pr | .allowed_merge_methods | join(\",\")")" "squash"
  # Each required check as context@app, so a check reported by another app doesn't count.
  check "Required checks, each from its app" "$(q '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[] | "\(.context)@\(.integration_id // "")"] | sort | join(",")')" "$(j ruleset-main.json "$CHECKS")"
  # GitHub leaves bypass_actors out of a ruleset read without admin rights.
  check "Bypass actors"                     "$(a api "repos/$REPO/rulesets/$id" --jq '[.bypass_actors[] | "\(.actor_type):\(.actor_id):\(.bypass_mode)"] | join(",")')" "$(j ruleset-main.json "$BYPASS")"
fi

# The smaller rulesets: active, with the rule types and bypass actors in their JSON file.
check_ruleset() { # name, file
  local rid
  rid=$(g api "repos/$REPO/rulesets" --jq ".[] | select(.name==\"$1\") | .id" | head -n1)
  if [ -z "$rid" ]; then echo "❌ Ruleset '$1' missing"; fail=1; return; fi
  check "Ruleset '$1' active"        "$(g api "repos/$REPO/rulesets/$rid" --jq .enforcement)" "active"
  check "Ruleset '$1' rules"         "$(g api "repos/$REPO/rulesets/$rid" --jq '[.rules[].type] | sort | join(",")')" "$(j "$2" "$RULE_TYPES")"
  check "Ruleset '$1' bypass actors" "$(a api "repos/$REPO/rulesets/$rid" --jq '[.bypass_actors[] | "\(.actor_type):\(.actor_id):\(.bypass_mode)"] | join(",")')" "$(j "$2" "$BYPASS")"
}
check_ruleset "Protect po-preview" ruleset-po-preview.json
check_ruleset "Protect tags" ruleset-tags.json

# Enabled answers 204 with no body; off answers 404.
va=$(a api "repos/$REPO/vulnerability-alerts" --silent) && va=true
check "Dependabot alerts"              "${va:-false}" "true"
check "Dependabot security fixes"      "$(a api "repos/$REPO/automated-security-fixes" --jq .enabled)" "true"
w() { a api "repos/$REPO/actions/permissions/workflow" --jq "$1"; }
check "Actions token read-only"        "$(w .default_workflow_permissions)" "read"
check "Actions can't approve PRs"      "$(w .can_approve_pull_request_reviews)" "false"
check "Secret scanning"                "$(a api "repos/$REPO" --jq .security_and_analysis.secret_scanning.status)" "enabled"
check "Push protection"                "$(a api "repos/$REPO" --jq .security_and_analysis.secret_scanning_push_protection.status)" "enabled"
check "Private vulnerability reporting" "$(g api "repos/$REPO/private-vulnerability-reporting" --jq .enabled)" "true"
check "Actions pinned to a full SHA"   "$(a api "repos/$REPO/actions/permissions" --jq .sha_pinning_required)" "true"
check "Only selected actions allowed"  "$(a api "repos/$REPO/actions/permissions" --jq .allowed_actions)" "selected"
allowed=$(printf '%s\n' 'anthropics/claude-code-action@*' 'codecov/codecov-action@*' "$REPO/*" 'oven-sh/setup-bun@*' | LC_ALL=C sort | paste -sd, -)
check "Allowed actions list" "$(a api "repos/$REPO/actions/permissions/selected-actions" --jq '"\(.github_owned_allowed) \(.verified_allowed) \(.patterns_allowed | sort | join(","))"')" \
  "true false $allowed"
check "Code scanning (CodeQL default)" "$(a api "repos/$REPO/code-scanning/default-setup" --jq .state)" "configured"
check "Fork PR runs need approval"     "$(a api "repos/$REPO/actions/permissions/fork-pr-contributor-approval" --jq .approval_policy)" "all_external_contributors"

# Interaction limit: collaborators only, and more than 30 days (2592000 s) before GitHub drops it.
# One call gives the limit, its expiry and that test; a missing limit or an unreadable reply is "none false".
limit_info=$(a api "repos/$REPO/interaction-limits" --jq '[(.limit // "none"), (.expires_at // "none"), (.expires_at != null and ((.expires_at | fromdateiso8601) - now) > 2592000)] | @tsv')
if [ "$limit_info" == "$NEEDS_ADMIN" ]; then
  check "Interaction limit" "$NEEDS_ADMIN" ""; expected_expiry=$NEEDS_ADMIN
else
  IFS=$'\t' read -r il_limit il_expires il_ok <<<"$limit_info"
  check "Interaction limit (expires ${il_expires:-none})" "${il_limit:-none} ${il_ok:-false}" "collaborators_only true"
  expected_expiry=${il_expires:0:10}
fi
# The variable backlog-interaction-limit.yml reads must be the live expiry's date.
check "Interaction limit expiry variable" "$(g variable get KINSCAPE_INTERACTION_LIMIT_EXPIRES --repo "$REPO")" "$expected_expiry"

# The logins whose comments the agents read must be the write collaborators.
source "$DIR/github/team-logins.sh"
check "Team logins variable" "$(g variable get KINSCAPE_TEAM_LOGINS --repo "$REPO")" "$(team_logins "$REPO")"

# One autolink per requirement ID prefix: none missing, none for another prefix or URL.
source "$DIR/github/requirement-prefixes.sh"
expected_links=$(expected_autolinks "$REPO" | LC_ALL=C sort) || expected_links="no requirement ID prefixes in docs/requirements.md"
actual_links=$(a api "repos/$REPO/autolinks" --jq '.[] | "\(.key_prefix) \(.url_template) \(.is_alphanumeric)"' | LC_ALL=C sort)
check "Requirement autolinks" "$actual_links" "$expected_links"

# The bot variables the workflows read. The values are in setup-github.sh; here the login must be
# set and the id must be GitHub's for that login. The App's client id is set by hand (docs/repo-settings.md).
bot_login=$(g variable get KINSCAPE_BOT_LOGIN --repo "$REPO")
bot_id=$(g variable get KINSCAPE_BOT_ID --repo "$REPO")
# An App's bot login ends in "[bot]", which the URL needs encoded.
encoded_login=${bot_login//\[/%5B}; encoded_login=${encoded_login//\]/%5D}
real_id=$([ -n "$bot_login" ] && g api "users/$encoded_login" --jq .id)
check "Bot id variable is the login's" "$bot_id" "${real_id:-no id for '$bot_login'}"

# The repo's secret and variable names must be exactly these (names only; no value is read). The
# _Secrets and variables_ table in docs/repo-settings.md links here; keep it in step.
# An unreadable list gives "", which fails.
expected_secrets="CLAUDE_CODE_OAUTH_TOKEN,KINSCAPE_APP_PRIVATE_KEY"
expected_variables="KINSCAPE_APP_CLIENT_ID,KINSCAPE_BOT_ID,KINSCAPE_BOT_LOGIN,KINSCAPE_INTERACTION_LIMIT_EXPIRES,KINSCAPE_TEAM_LOGINS"
actual_secrets=$(g secret list --repo "$REPO" --json name --jq 'map(.name) | sort | join(",")')
actual_variables=$(g variable list --repo "$REPO" --json name --jq 'map(.name) | sort | join(",")')
check "Secrets (${actual_secrets:-unreadable})"     "$actual_secrets"   "$expected_secrets"
check "Variables (${actual_variables:-unreadable})" "$actual_variables" "$expected_variables"

[ "$locked" -gt 0 ] && echo "🔒 $locked settings need a repo admin's token to check: run as admin."
exit $fail
