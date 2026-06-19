#!/usr/bin/env bash
set -euo pipefail

. "$(dirname "$0")/load-env.sh"

script_dir="$(cd "$(dirname "$0")" && pwd)"

default_db_host() {
    if [ -n "${DB_HOST:-}" ]; then
        printf '%s\n' "$DB_HOST"
    elif getent hosts postgres >/dev/null 2>&1; then
        printf '%s\n' "postgres"
    else
        printf '%s\n' "localhost"
    fi
}

export BE_PORT FE_PORT
export DB_HOST="$(default_db_host)"
export DB_NAME="${DB_NAME:-quizmaster}"
export DB_USER="${DB_USER:-quizmaster}"
export DB_PASS="${DB_PASS:-quizmaster}"
export DB_SCHEMA="${DB_SCHEMA:-public}"

if [ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ] && command -v chromium >/dev/null 2>&1; then
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(command -v chromium)"
fi

if [ -n "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ] && [ -z "${PLAYWRIGHT_VIDEO:-}" ]; then
    export PLAYWRIGHT_VIDEO=off
fi

port_busy() { (echo >/dev/tcp/localhost/"$1") 2>/dev/null; }

truthy() {
    case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
    esac
}

disabled() {
    case "${1:-}" in
    0 | false | FALSE | no | NO | off | OFF) return 0 ;;
    *) return 1 ;;
    esac
}

reset_db_for_standalone_run() {
    if disabled "${E2E_RESET_DB:-}"; then
        echo "Skipping E2E DB reset because E2E_RESET_DB=$E2E_RESET_DB"
        return
    fi

    "$script_dir/reset-app-db.sh"
}

reset_db_for_running_servers_if_requested() {
    if truthy "${E2E_RESET_DB:-}"; then
        "$script_dir/reset-app-db.sh"
    fi
}

require_servers_up() {
    if ! port_busy "$BE_PORT" || ! port_busy "$FE_PORT"; then
        echo "Backend (:$BE_PORT) and Vite (:$FE_PORT) must be running."
        echo "Run 'pnpm start' first, or use 'pnpm test:e2e' for a standalone run."
        exit 1
    fi
}

require_ports_free() {
    if port_busy "$BE_PORT" || port_busy "$FE_PORT"; then
        echo "Ports $BE_PORT and/or $FE_PORT are in use."
        echo "Stop them first, or use 'pnpm test:e2e:dev' to test against running servers."
        exit 1
    fi
}

coverage_mode=
case "${1:-}" in
--dev)      shift; require_servers_up; reset_db_for_running_servers_if_requested; exec pnpm test:e2e:vite          -- "$@" ;;
--ui)       shift; require_servers_up; reset_db_for_running_servers_if_requested; exec pnpm test:e2e:playwright-ui -- "$@" ;;
--coverage) shift; export ENABLE_BACKEND_COVERAGE=1; coverage_mode=1; inner_cmd="pnpm coverage:e2e:run" ;;
*)                 inner_cmd="pnpm test:e2e:be" ;;
esac

require_ports_free
reset_db_for_standalone_run
for arg in "$@"; do inner_cmd+=" $(printf '%q' "$arg")"; done

concurrently --kill-others --success first \
    "pnpm build:fe:dev && cd backend && ./gradlew bootRun --args='--spring.profiles.active=e2e'" \
    "$inner_cmd"

# bootRun has now exited, so JaCoCo has flushed e2e.exec — generate the merged BE report.
if [[ -n "$coverage_mode" ]]; then
    (cd backend && ./gradlew jacocoMergedReport)
fi
