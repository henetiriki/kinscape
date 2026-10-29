#!/usr/bin/env bash
# Check that GitHub's live settings match what scripts/setup-github.sh applies.
# Read-only. Exits non-zero if anything has drifted.
set -uo pipefail
REPO="${1:-henetiriki/kinscape}"
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
  check "Code-owner review required"        "$(q "$pr | .require_code_owner_review")" "true"
  check "Conversations must be resolved"   "$(q "$pr | .required_review_thread_resolution")" "true"
  check "Squash only in ruleset"            "$(q "$pr | .allowed_merge_methods | join(\",\")")" "squash"
  check "Required checks" "$(q '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context] | sort | join(",")')" "$expected_checks"
  check "Bypass: admin, via PR only"        "$(q '[.bypass_actors[] | "\(.actor_type):\(.actor_id):\(.bypass_mode)"] | join(",")')" "RepositoryRole:5:pull_request"
fi

if gh api "repos/$REPO/vulnerability-alerts" --silent 2>/dev/null; then va=true; else va=false; fi
check "Dependabot alerts"              "$va" "true"
check "Dependabot security fixes"      "$(gh api "repos/$REPO/automated-security-fixes" --jq .enabled 2>/dev/null)" "true"
w() { gh api "repos/$REPO/actions/permissions/workflow" --jq "$1"; }
check "Actions token read-only"        "$(w .default_workflow_permissions)" "read"
check "Actions can't approve PRs"      "$(w .can_approve_pull_request_reviews)" "false"

exit $fail
