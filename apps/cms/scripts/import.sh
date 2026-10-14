#!/usr/bin/env bash
#
# Import a WordPress export produced by scripts/export.sh (see exports/HANDOFF.md).
# ⚠️ Destructive: overwrites the current database. The stack must be running.
#
# Usage:
#   pnpm --filter cms run import             # newest exports/wordpress-*.sql.gz
#   pnpm --filter cms run import 20261014    # a specific date stamp
#   pnpm --filter cms run import path/to/dump.sql.gz
#   FORCE=1 pnpm --filter cms run import     # skip the confirmation prompt
set -euo pipefail

cd "$(dirname "$0")/.." # apps/cms

if ! docker compose ps --status running --services | grep -qx db; then
  echo "The CMS stack isn't running. Start it first: pnpm --filter cms up" >&2
  exit 1
fi

# Resolve the DB dump: explicit path, a date stamp, or the newest in exports/.
arg="${1:-}"
if [ -n "$arg" ] && [ -f "$arg" ]; then
  db_file="$arg"
elif [ -n "$arg" ]; then
  db_file="exports/wordpress-${arg}.sql.gz"
else
  db_file="$(ls -t exports/wordpress-*.sql.gz 2>/dev/null | head -1 || true)"
fi

if [ -z "${db_file:-}" ] || [ ! -f "$db_file" ]; then
  echo "No database dump found (looked for '${arg:-exports/wordpress-*.sql.gz}')." >&2
  exit 1
fi

stamp="$(basename "$db_file" | sed -E 's/^wordpress-(.*)\.sql\.gz$/\1/')"
up_file="exports/uploads-${stamp}.tar.gz"

echo "About to import into the running database (this OVERWRITES current data):"
echo "  db:      $db_file"
echo "  uploads: $([ -f "$up_file" ] && echo "$up_file" || echo '(none found — will skip)')"
if [ "${FORCE:-}" != "1" ] && [ -r /dev/tty ]; then
  printf "Continue? [y/N] "
  read -r reply </dev/tty
  case "$reply" in [yY]*) ;; *) echo "Aborted."; exit 1 ;; esac
fi

echo "Importing database..."
gzip -dc "$db_file" \
  | docker compose exec -T db sh -c 'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"'

if [ -f "$up_file" ]; then
  echo "Restoring uploads..."
  docker compose exec -T wordpress sh -c 'cd wp-content && tar xzf -' <"$up_file"
else
  echo "No matching uploads archive — skipping."
fi

echo "Flushing caches and rewrites..."
docker compose run --rm --entrypoint wp wp-cli cache flush --url=http://localhost/ >/dev/null 2>&1 || true
docker compose run --rm --entrypoint wp wp-cli rewrite flush --url=http://localhost/ >/dev/null 2>&1 || true

echo "Import complete. If serving from a non-localhost origin, run wp search-replace (see exports/HANDOFF.md)."
