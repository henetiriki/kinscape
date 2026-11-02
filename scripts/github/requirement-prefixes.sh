# Sourced by setup-github.sh and check-github.sh: the autolinks every requirement ID prefix needs.

# Print the ID prefixes (MAP, NFR, ...) from the ID cells of docs/requirements.md, one per line.
# Fails with no output if it finds none, so a reformatted file can't be read as "no autolinks".
requirement_prefixes() {
  local prefixes
  prefixes=$(sed -n 's/^| <a id="[a-z0-9-]*"><\/a>\([A-Z][A-Z]*\)-[0-9][0-9]* .*/\1/p' \
    "$(dirname "${BASH_SOURCE[0]}")/../../docs/requirements.md" | LC_ALL=C sort -u)
  [ -n "$prefixes" ] || return 1
  printf '%s\n' "$prefixes"
}

# Print "<key_prefix> <url_template> <is_alphanumeric>" for each prefix, e.g.
# "MAP- https://github.com/OWNER/NAME/blob/main/docs/requirements.md#map-<num> true".
expected_autolinks() { # repo
  local prefix
  requirement_prefixes | while read -r prefix; do
    echo "$prefix- https://github.com/$1/blob/main/docs/requirements.md#$(echo "$prefix" | tr A-Z a-z)-<num> true"
  done
  return "${PIPESTATUS[0]}"
}
