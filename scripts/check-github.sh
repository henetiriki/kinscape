#!/usr/bin/env bash
# Check that GitHub's live settings match what scripts/setup-github.sh applies.
# Read-only. Exits non-zero if anything has drifted.
set -uo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
fail=0

# Required checks come from the ruleset file; an unreadable file gives "", which fails the check.
expected_checks=$(node -e '
  const rules = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).rules;
  const contexts = rules.filter((r) => r.type === "required_status_checks").flatMap((r) => r.parameters.required_status_checks.map((c) => c.context));
  console.log(contexts.sort().join(","));
' "$DIR/github/ruleset-main.json" 2>/dev/null)

check() { # description, actual, expected
  if [ "$2" == "$3" ]; then echo "✅ $1"; else echo "❌ $1: is '$2', expected '$3'"; fail=1; fi
}

r() { gh api "repos/$REPO" --jq "$1"; }
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
policies=$(gh api graphql -f query='{ repository(owner: "'"${REPO%/*}"'", name: "'"${REPO#*/}"'") { issueCreationPolicy pullRequestCreationPolicy } }' \
  --jq '.data.repository | "\(.issueCreationPolicy) \(.pullRequestCreationPolicy)"' 2>/dev/null)
check "Issue creation: collaborators"  "${policies% *}" "COLLABORATORS_ONLY"
check "PR creation: collaborators"     "${policies#* }" "COLLABORATORS_ONLY"

ids=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="Protect main") | .id')
id=$(printf '%s\n' "$ids" | head -n1)
if [ -z "$id" ]; then
  echo "❌ Ruleset 'Protect main' missing"; fail=1
else
  check "Single 'Protect main' ruleset" "$(printf '%s\n' "$ids" | wc -l | tr -d ' ')" "1"
  q() { gh api "repos/$REPO/rulesets/$id" --jq "$1"; }
  pr='.rules[] | select(.type=="pull_request") | .parameters'
  check "Ruleset active"                    "$(q .enforcement)" "active"
  check "Ruleset targets default branch"    "$(q '.conditions.ref_name.include | join(",")')" "~DEFAULT_BRANCH"
  check "Block deletion"                    "$(q '[.rules[].type] | index("deletion") != null')" "true"
  check "Block force push"                  "$(q '[.rules[].type] | index("non_fast_forward") != null')" "true"
  check "Linear history"                    "$(q '[.rules[].type] | index("required_linear_history") != null')" "true"
  check "PR required, 1 approval"           "$(q "$pr | .required_approving_review_count")" "1"
  check "Stale approvals dismissed"         "$(q "$pr | .dismiss_stale_reviews_on_push")" "true"
  check "Last push needs approval"          "$(q "$pr | .require_last_push_approval")" "true"
  check "Branches must be up to date"       "$(q '.rules[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy')" "true"
  check "Code-owner review required"        "$(q "$pr | .require_code_owner_review")" "true"
  check "Conversations must be resolved"   "$(q "$pr | .required_review_thread_resolution")" "true"
  check "Squash only in ruleset"            "$(q "$pr | .allowed_merge_methods | join(\",\")")" "squash"
  check "Required checks" "$(q '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context] | sort | join(",")')" "$expected_checks"
  check "Bypass: admin, via PR only"        "$(q '[.bypass_actors[] | "\(.actor_type):\(.actor_id):\(.bypass_mode)"] | join(",")')" "RepositoryRole:5:pull_request"
fi

# The smaller rulesets: active, and enforcing the rule types in their JSON file.
check_ruleset() { # name, file
  local rid want
  rid=$(gh api "repos/$REPO/rulesets" --jq ".[] | select(.name==\"$1\") | .id" | head -n1)
  if [ -z "$rid" ]; then echo "❌ Ruleset '$1' missing"; fail=1; return; fi
  want=$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).rules.map((r) => r.type).sort().join(","))' "$DIR/github/$2" 2>/dev/null)
  check "Ruleset '$1' active"  "$(gh api "repos/$REPO/rulesets/$rid" --jq .enforcement)" "active"
  check "Ruleset '$1' rules"   "$(gh api "repos/$REPO/rulesets/$rid" --jq '[.rules[].type] | sort | join(",")')" "$want"
}
check_ruleset "Protect po-preview" ruleset-po-preview.json
check_ruleset "Protect tags" ruleset-tags.json

if gh api "repos/$REPO/vulnerability-alerts" --silent 2>/dev/null; then va=true; else va=false; fi
check "Dependabot alerts"              "$va" "true"
check "Dependabot security fixes"      "$(gh api "repos/$REPO/automated-security-fixes" --jq .enabled 2>/dev/null)" "true"
w() { gh api "repos/$REPO/actions/permissions/workflow" --jq "$1"; }
check "Actions token read-only"        "$(w .default_workflow_permissions)" "read"
check "Actions can't approve PRs"      "$(w .can_approve_pull_request_reviews)" "false"
check "Secret scanning"                "$(r .security_and_analysis.secret_scanning.status)" "enabled"
check "Push protection"                "$(r .security_and_analysis.secret_scanning_push_protection.status)" "enabled"
check "Private vulnerability reporting" "$(gh api "repos/$REPO/private-vulnerability-reporting" --jq .enabled 2>/dev/null)" "true"
check "Actions pinned to a full SHA"   "$(gh api "repos/$REPO/actions/permissions" --jq .sha_pinning_required)" "true"
check "Only selected actions allowed"  "$(gh api "repos/$REPO/actions/permissions" --jq .allowed_actions)" "selected"
allowed=$(printf '%s\n' 'anthropics/claude-code-action@*' 'codecov/codecov-action@*' "$REPO/*" 'oven-sh/setup-bun@*' | LC_ALL=C sort | paste -sd, -)
check "Allowed actions list" "$(gh api "repos/$REPO/actions/permissions/selected-actions" --jq '"\(.github_owned_allowed) \(.verified_allowed) \(.patterns_allowed | sort | join(","))"')" \
  "true false $allowed"
check "Code scanning (CodeQL default)" "$(gh api "repos/$REPO/code-scanning/default-setup" --jq .state 2>/dev/null)" "configured"
check "Fork PR runs need approval"     "$(gh api "repos/$REPO/actions/permissions/fork-pr-contributor-approval" --jq .approval_policy)" "all_external_contributors"

# The bot variables the workflows read. The values are in setup-github.sh; here the login must be
# set and the id must be GitHub's for that login.
bot_login=$(gh variable get KINSCAPE_BOT_LOGIN --repo "$REPO" 2>/dev/null)
bot_id=$(gh variable get KINSCAPE_BOT_ID --repo "$REPO" 2>/dev/null)
check "Bot login variable set"         "$([ -n "$bot_login" ] && echo true || echo false)" "true"
real_id=$([ -n "$bot_login" ] && gh api "users/$bot_login" --jq .id 2>/dev/null)
check "Bot id variable is the login's" "$bot_id" "${real_id:-no id for '$bot_login'}"

exit $fail
