#!/usr/bin/env bash
# Run the FULL Quizmaster Cucumber/Playwright E2E suite locally with NO host Java/Postgres.
#
#   1. builds the frontend on the host (fast — host node/pnpm, no JDK)
#   2. stops the run-app launcher's backend if up (they share the repo's backend/build)
#   3. starts a throwaway Postgres + the backend (e2e profile) in Docker on :8080
#   4. runs the specs on the host against http://localhost:8080
#   5. tears the stack down (keeps the shared Gradle cache)
#
# Usage (from anywhere):
#   .claude/skills/run-app/test-e2e-docker.sh                      # whole suite
#   .claude/skills/run-app/test-e2e-docker.sh --grep "tabs"        # forwarded to playwright
#   QUIZMASTER_DIR=/path/to/repo .claude/skills/run-app/test-e2e-docker.sh
#
# Exit code mirrors the Playwright suite (0 = pass). The launcher backend is left
# stopped; the script prints how to bring your preview back up.
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_CF="$SKILL_DIR/docker-compose.yml"
E2E_CF="$SKILL_DIR/docker-compose.e2e.yml"
REPO="${QUIZMASTER_DIR:-$(cd "$SKILL_DIR/../../.." && pwd)}"
PORT=8080

cd "$REPO" || { echo "repo not found: $REPO"; exit 2; }

teardown() { docker compose -f "$E2E_CF" down >/dev/null 2>&1 || true; }

echo "==> [1/5] Building frontend on host (build:fe:dev)"
pnpm build:fe:dev || { echo "frontend build failed"; exit 2; }

echo "==> [2/5] Stopping launcher backend if running (shares backend/build)"
docker compose -f "$RUN_CF" stop app >/dev/null 2>&1 || true

echo "==> [3/5] Starting E2E stack (fresh Postgres + backend, e2e profile) on :$PORT"
docker volume create quizmaster-run_quizmaster-gradle >/dev/null 2>&1 || true   # ensure shared cache exists
teardown
docker compose -f "$E2E_CF" up -d --force-recreate || { echo "compose up failed"; teardown; exit 2; }

echo "    waiting for backend on :$PORT (first boot migrates a fresh DB) ..."
if ! curl -sf --retry 100 --retry-delay 3 --retry-all-errors -o /dev/null "http://localhost:$PORT/"; then
    echo "backend did not become healthy; recent logs:"
    docker compose -f "$E2E_CF" logs --tail 80 app
    teardown
    exit 2
fi
echo "    backend up."

WORKERS="${PW_WORKERS:-6}"   # default 6 (host has 10 cores; backend Hikari pool caps at 10) — override: PW_WORKERS=8 ...
echo "==> [4/5] Running specs on host (E2E_BASE_PORT=$PORT, PW_WORKERS=$WORKERS)"
( cd specs && E2E_BASE_PORT="$PORT" PW_WORKERS="$WORKERS" pnpm playwright:test "$@" )
code=$?

echo "==> [5/5] Tearing down E2E stack (shared Gradle cache kept)"
teardown

echo
if [ "$code" -eq 0 ]; then
    echo "✅ E2E suite passed."
else
    echo "❌ E2E suite failed (exit $code)."
    echo "   Report: (cd $REPO/specs && pnpm exec playwright show-report)"
fi
echo "ℹ️  Launcher backend was stopped. Bring your preview back with:"
echo "    docker compose -f \"$RUN_CF\" up -d"
exit "$code"
