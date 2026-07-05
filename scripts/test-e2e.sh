#!/usr/bin/env bash
set -euo pipefail

. "$(dirname "$0")/load-env.sh"

port_busy() { (echo >/dev/tcp/localhost/"$1") 2>/dev/null; }

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
--dev)      shift; require_servers_up; exec pnpm test:e2e:vite          -- "$@" ;;
--ui)       shift; require_servers_up; exec pnpm test:e2e:playwright-ui -- "$@" ;;
--coverage) shift; export ENABLE_BACKEND_COVERAGE=1; coverage_mode=1; inner_cmd="pnpm coverage:e2e:run" ;;
*)                 inner_cmd="pnpm test:e2e:be" ;;
esac

require_ports_free
for arg in "$@"; do inner_cmd+=" $(printf '%q' "$arg")"; done

concurrently --kill-others --success first \
    "pnpm build:fe:dev && cd backend && ./gradlew bootRun --args='--spring.profiles.active=e2e'" \
    "$inner_cmd"

# bootRun has now exited, so JaCoCo has flushed e2e.exec — generate the merged BE report.
if [[ -n "$coverage_mode" ]]; then
    (cd backend && ./gradlew jacocoMergedReport)
fi
