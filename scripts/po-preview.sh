# scripts/po-preview.sh <pr-number>: point the PO's shared link at a PR
set -euo pipefail
git fetch origin "pull/$1/head"
head=$(git rev-parse FETCH_HEAD)
sha=$(git commit-tree "$head^{tree}" -p "$head" -m "preview: PR #$1")
git push --force origin "$sha:refs/heads/po-preview"