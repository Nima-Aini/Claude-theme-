#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${1:?Application directory is required}"
PM2_APP="${2:?PM2 application name is required}"
APP_URL="${3:?Application health URL is required}"
BRANCH="${4:-main}"
TEST_PORT="${DEPLOY_TEST_PORT:-3999}"
BACKUP_ROOT="${DEPLOY_BACKUP_DIR:-/var/backups/project1}"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Deploy aborted: $APP_DIR/.env is missing"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Deploy aborted: the server has uncommitted tracked changes"
  git status --short --untracked-files=no
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
BACKUP_FILE="$BACKUP_ROOT/database-$(date -u +%Y%m%dT%H%M%SZ).dump"

node -r dotenv/config - "$BACKUP_FILE" <<'NODE'
const { spawnSync } = require("node:child_process");
const backupFile = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Deploy aborted: DATABASE_URL is missing from .env");
  process.exit(1);
}

const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--file", backupFile, databaseUrl],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Deploy aborted: pg_dump could not start: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
NODE

echo "Database backup created: $BACKUP_FILE"

git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git merge --ff-only "origin/$BRANCH"

npm ci --no-audit --no-fund
npm run build

if [[ ! -f .next/standalone/server.js ]]; then
  echo "Deploy aborted: standalone server was not created"
  exit 1
fi

mkdir -p .next/standalone/.next/static
cp -a .next/static/. .next/standalone/.next/static/

if [[ -d public ]]; then
  mkdir -p .next/standalone/public
  cp -a public/. .next/standalone/public/
fi

TEST_LOG="$(mktemp /tmp/project1-deploy-test.XXXXXX.log)"
TEST_PID=""

cleanup() {
  if [[ -n "$TEST_PID" ]] && kill -0 "$TEST_PID" 2>/dev/null; then
    kill "$TEST_PID" 2>/dev/null || true
    wait "$TEST_PID" 2>/dev/null || true
  fi
  rm -f "$TEST_LOG"
}
trap cleanup EXIT

PORT="$TEST_PORT" HOSTNAME="127.0.0.1" NODE_ENV="production" \
  node .next/standalone/server.js >"$TEST_LOG" 2>&1 &
TEST_PID=$!

TEST_OK="false"
for _ in $(seq 1 30); do
  if curl --silent --fail "http://127.0.0.1:${TEST_PORT}/api/health" >/dev/null; then
    TEST_OK="true"
    break
  fi
  sleep 1
done

if [[ "$TEST_OK" != "true" ]]; then
  echo "Deploy aborted: the new build failed its local health check"
  tail -n 100 "$TEST_LOG"
  exit 1
fi

kill "$TEST_PID" 2>/dev/null || true
wait "$TEST_PID" 2>/dev/null || true
TEST_PID=""

pm2 restart "$PM2_APP" --update-env

PUBLIC_OK="false"
for _ in $(seq 1 30); do
  if curl --silent --fail "${APP_URL%/}/api/health" >/dev/null; then
    PUBLIC_OK="true"
    break
  fi
  sleep 1
done

if [[ "$PUBLIC_OK" != "true" ]]; then
  echo "Deploy failed: production health check did not pass"
  pm2 logs "$PM2_APP" --lines 100 --nostream
  exit 1
fi

echo "Deploy completed successfully"
