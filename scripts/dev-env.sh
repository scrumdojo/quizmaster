#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$root/scripts/init-env.sh"
. "$root/scripts/load-env.sh"

export BE_PORT
export FE_PORT
export DB_HOST="${DB_HOST:-localhost}"
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

proxy_url="${https_proxy:-${HTTPS_PROXY:-${http_proxy:-${HTTP_PROXY:-}}}}"
if [ -n "$proxy_url" ] && [[ "$proxy_url" =~ ^https?://([^/:]+):([0-9]+)/?$ ]]; then
    proxy_host="${BASH_REMATCH[1]}"
    proxy_port="${BASH_REMATCH[2]}"
    non_proxy_hosts="${no_proxy:-${NO_PROXY:-localhost,127.0.0.1}}"
    non_proxy_hosts="${non_proxy_hosts//,/|}"
    gradle_proxy_opts="-Dhttp.proxyHost=$proxy_host -Dhttp.proxyPort=$proxy_port -Dhttps.proxyHost=$proxy_host -Dhttps.proxyPort=$proxy_port -Dhttp.nonProxyHosts=$non_proxy_hosts -Dhttps.nonProxyHosts=$non_proxy_hosts"

    if [[ "${GRADLE_OPTS:-}" != *"-Dhttps.proxyHost="* ]]; then
        export GRADLE_OPTS="${GRADLE_OPTS:-} $gradle_proxy_opts"
    fi
fi
