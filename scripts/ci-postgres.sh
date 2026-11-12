#!/usr/bin/env bash
# Starts a throwaway Postgres with TLS for CI (NFR-09) and exports how to reach it.
#
# Usage: scripts/ci-postgres.sh test|e2e
#   test  exports KINSCAPE_DATABASE_CA_FILE and KINSCAPE_TEST_DATABASE_URL (the contract suites).
#   e2e   exports KINSCAPE_DATABASE_CA_FILE, KINSCAPE_DATABASE_URL and KINSCAPE_DATABASE_DIRECT_URL.
#
# In GitHub Actions the values go to $GITHUB_ENV. Elsewhere they print as KEY=value lines.
# The password and the certificate are made for this run and held nowhere.
set -euo pipefail

# Same major version as the Supabase projects (docs/infrastructure.md). A person moves the pin:
# Dependabot does not read shell scripts.
IMAGE='postgres:17@sha256:ff87138949ad9a46f32ff23bd6852b52ce024a13dffe9b4087be98292cdd3b4f'
NAME=ks-ci-postgres
DIR=/tmp/ci-postgres
PORT=5432

mode="${1:-}"

if [[ "$mode" != test && "$mode" != e2e ]]; then
  echo "Usage: $0 test|e2e" >&2
  exit 1
fi

password="$(openssl rand -hex 16)"

rm -rf "$DIR"
mkdir -p "$DIR"

# One self-signed certificate is both the server's certificate and the CA file the app trusts.
# `verify-full` checks the host name, so the certificate names `localhost` and `127.0.0.1`.
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj '/CN=localhost' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' \
  -keyout "$DIR/server.key" -out "$DIR/ca.crt" 2>/dev/null

docker rm --force "$NAME" >/dev/null 2>&1 || true

# Postgres refuses a key that the runner's user owns, and the container's user cannot read
# the runner's files. So the container copies the files and sets their owner before it starts.
docker run --detach --name "$NAME" \
  --publish "127.0.0.1:$PORT:5432" \
  --env POSTGRES_PASSWORD="$password" \
  --volume "$DIR:/certs:ro" \
  --entrypoint sh "$IMAGE" -c '
    install -o postgres -g postgres -m 600 /certs/server.key /var/lib/postgresql/server.key &&
    install -o postgres -g postgres -m 644 /certs/ca.crt /var/lib/postgresql/server.crt &&
    exec docker-entrypoint.sh postgres \
      -c ssl=on \
      -c ssl_cert_file=/var/lib/postgresql/server.crt \
      -c ssl_key_file=/var/lib/postgresql/server.key
  ' >/dev/null

# Ask over TCP: while it initialises, the image runs a server that listens on a socket only.
for _ in $(seq 1 60); do
  if docker exec "$NAME" pg_isready --host 127.0.0.1 --username postgres >/dev/null 2>&1; then
    ready=1
    break
  fi

  sleep 1
done

if [[ -z "${ready:-}" ]]; then
  echo 'Postgres did not become ready in 60 seconds.' >&2
  docker logs "$NAME" >&2
  exit 1
fi

url="postgres://postgres:$password@localhost:$PORT/postgres?sslmode=verify-full"

if [[ "$mode" == test ]]; then
  vars=("KINSCAPE_DATABASE_CA_FILE=$DIR/ca.crt" "KINSCAPE_TEST_DATABASE_URL=$url")
else
  vars=(
    "KINSCAPE_DATABASE_CA_FILE=$DIR/ca.crt"
    "KINSCAPE_DATABASE_URL=$url"
    "KINSCAPE_DATABASE_DIRECT_URL=$url"
  )
fi

if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf '%s\n' "${vars[@]}" >>"$GITHUB_ENV"
else
  printf '%s\n' "${vars[@]}"
fi
