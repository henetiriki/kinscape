# setup-github.sh, check-github.sh and backfill-issue-types.sh source this file: the repo's issue Types, in one place.

# Print one line per Type: name|COLOUR|description. COLOUR is a GraphQL IssueTypeColor value.
issue_types() {
  cat <<'EOF'
Intent|PURPLE|What the PO wants and why
Spec|BLUE|Requirements and design for an accepted intent
Bug|RED|Something isn't working
Chore|GREEN|Tooling, CI, docs or process change filed by the tech lead
EOF
}

# The owner's live Types as id|name|COLOUR|description|isEnabled, one per line.
# The Types belong to the repo owner; GraphQL is the only API for a personal account's Types.
live_issue_types() { # repo
  gh api graphql -f owner="${1%/*}" -f name="${1#*/}" -f query='
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        issueTypes(first: 25) { nodes { id name color description isEnabled } }
      }
    }' --jq '.data.repository.issueTypes.nodes[] | "\(.id)|\(.name)|\(.color)|\(.description // "")|\(.isEnabled)"'
}
