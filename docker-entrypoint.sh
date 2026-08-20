#!/bin/sh
# Boot sequence for the container: make the mounted volume writable, apply
# pending migrations, optionally bootstrap an empty database, then hand off to
# the Next.js server as an unprivileged user.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Expected something like file:/data/prod.db" >&2
  exit 1
fi

DB_PATH=$(printf '%s' "${DATABASE_URL#file:}" | sed 's/?.*$//')
DB_DIR=$(dirname "$DB_PATH")

# Volume providers (Railway among them) mount the volume owned by root, which
# shadows the chown done at build time. Fix it here, on every boot, while we
# still have the privileges to do so.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DB_DIR"
  chown -R nextjs:nodejs "$DB_DIR"
  RUN_AS="gosu nextjs:nodejs"
else
  # Already unprivileged (e.g. RAILWAY_RUN_UID set, or `docker run --user`).
  RUN_AS=""
fi

cd /ops

echo "==> Applying database migrations"
$RUN_AS node node_modules/prisma/build/index.js migrate deploy

# One-time bootstrap for a fresh volume. prisma/seed.ts deletes every category,
# product AND order before inserting, so this refuses to run against a database
# that already holds data — leaving SEED_ON_BOOT set by accident is harmless.
if [ "$SEED_ON_BOOT" = "true" ]; then
  rows=$($RUN_AS node -e '
    const Database = require("better-sqlite3");
    const file = (process.env.DATABASE_URL || "").replace(/^file:/, "").replace(/\?.*$/, "");
    const db = new Database(file, { readonly: true });
    const row = db.prepare("SELECT (SELECT COUNT(*) FROM Category) + (SELECT COUNT(*) FROM \"Order\") AS n").get();
    console.log(row.n);
  ')

  if [ "$rows" = "0" ]; then
    echo "==> SEED_ON_BOOT=true and database is empty — seeding"
    $RUN_AS node_modules/.bin/tsx prisma/seed.ts
    echo "==> Seeding complete. Unset SEED_ON_BOOT and change the admin password."
  else
    echo "==> SEED_ON_BOOT=true but the database already holds data ($rows rows) — skipping."
    echo "    Seeding would delete every product and order. Wipe the volume first if"
    echo "    that is genuinely what you want."
  fi
fi

cd /app

echo "==> Starting server on port ${PORT}"
exec $RUN_AS "$@"
