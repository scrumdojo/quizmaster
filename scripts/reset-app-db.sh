#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

. "$root/scripts/load-env.sh"

default_db_host() {
    if [ -n "${DB_HOST:-}" ]; then
        printf '%s\n' "$DB_HOST"
    elif getent hosts postgres >/dev/null 2>&1; then
        printf '%s\n' "postgres"
    else
        printf '%s\n' "localhost"
    fi
}

db_host="$(default_db_host)"
db_name="${DB_NAME:-quizmaster}"
db_user="${DB_USER:-quizmaster}"
db_pass="${DB_PASS:-quizmaster}"
db_schema="${DB_SCHEMA:-public}"

export PGPASSWORD="$db_pass"

echo "Resetting Quizmaster app data in $db_name on $db_host schema $db_schema"
psql -v ON_ERROR_STOP=1 -h "$db_host" -U "$db_user" -d "$db_name" -v schema="$db_schema" <<'SQL'
SET search_path TO :"schema";
TRUNCATE TABLE attempt_question, attempt, cohort, quiz, question, workspace RESTART IDENTITY CASCADE;
SQL
