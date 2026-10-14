#!/usr/bin/env bash
#
# Export the WordPress Multisite data for out-of-band handoff. Writes two dated
# files into exports/ (gitignored): the full database dump (all tenants live in
# the single `wordpress` DB) and the wp-content/uploads tree. Credentials are
# read from the running `db` container, never hardcoded.
#
# Usage: pnpm --filter cms export      (or ./scripts/export.sh)
set -euo pipefail

cd "$(dirname "$0")/.." # apps/cms

if ! docker compose ps --status running --services | grep -qx db; then
  echo "The CMS stack isn't running. Start it first: pnpm --filter cms up" >&2
  exit 1
fi

stamp="$(date +%Y%m%d)"
mkdir -p exports
db_out="exports/wordpress-${stamp}.sql.gz"
up_out="exports/uploads-${stamp}.tar.gz"

echo "Dumping database -> ${db_out}"
docker compose exec -T db sh -c \
  'exec mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --databases "$MARIADB_DATABASE" --single-transaction --quick --default-character-set=utf8mb4' \
  | gzip >"${db_out}"

echo "Archiving uploads -> ${up_out}"
docker compose exec -T wordpress sh -c 'cd wp-content && tar czf - uploads' >"${up_out}"

echo
echo "Done. Hand these off (see exports/HANDOFF.md):"
ls -lh "${db_out}" "${up_out}"
