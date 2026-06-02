#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
ci_image="${QUIZMASTER_CI_IMAGE:-ghcr.io/scrumdojo/dev-quizmaster:v4}"
container_runtime="${QUIZMASTER_CONTAINER_RUNTIME:-}"
container_cmd=()
ci_id="quizmaster-ci-$$"
ci_network="$ci_id-network"
postgres_container="$ci_id-postgres"

runtime_available() {
    command -v "$1" >/dev/null 2>&1 && "$1" info >/dev/null 2>&1
}

select_container_runtime() {
    if [[ -n "$container_runtime" ]]; then
        case "$container_runtime" in
        docker | podman) ;;
        *)
            echo "Unsupported QUIZMASTER_CONTAINER_RUNTIME=$container_runtime. Use docker or podman."
            exit 1
            ;;
        esac

        if ! runtime_available "$container_runtime"; then
            echo "$container_runtime is not installed, running, or reachable."
            exit 1
        fi

        container_cmd=("$container_runtime")
        return
    fi

    if runtime_available docker; then
        container_runtime=docker
        container_cmd=(docker)
        return
    fi

    if runtime_available podman; then
        container_runtime=podman
        container_cmd=(podman)
        return
    fi

    echo "Docker or Podman must be installed and running."
    exit 1
}

cleanup() {
    "${container_cmd[@]}" rm -f "$postgres_container" >/dev/null 2>&1 || true
    "${container_cmd[@]}" network rm "$ci_network" >/dev/null 2>&1 || true
}

wait_for_postgres() {
    for _ in {1..60}; do
        if "${container_cmd[@]}" exec "$postgres_container" pg_isready -U quizmaster -d quizmaster >/dev/null 2>&1; then
            return 0
        fi

        sleep 1
    done

    echo "PostgreSQL did not become ready in time."
    return 1
}

cd "$repo_root"

select_container_runtime
trap cleanup EXIT

case "$(uname -s)" in
MINGW* | MSYS* | CYGWIN*)
    if ! command -v cygpath >/dev/null 2>&1; then
        echo "cygpath is required when running from Git for Windows."
        exit 1
    fi
    container_repo_root="$(cygpath -w "$repo_root")"
    ;;
*)
    container_repo_root="$repo_root"
    ;;
esac

echo "Using $container_runtime for local CI."
echo "Starting isolated PostgreSQL service for local CI..."
"${container_cmd[@]}" network create "$ci_network" >/dev/null
"${container_cmd[@]}" run -d \
    --name "$postgres_container" \
    --network "$ci_network" \
    --network-alias postgres \
    -e POSTGRES_USER=quizmaster \
    -e POSTGRES_PASSWORD=quizmaster \
    -e POSTGRES_DB=quizmaster \
    postgres:16 >/dev/null
wait_for_postgres

echo "Running CI checks in $ci_image..."

MSYS_NO_PATHCONV=1 "${container_cmd[@]}" run --rm \
    --network "$ci_network" \
    --entrypoint zsh \
    -e CI=true \
    -e HOME=/home/dev \
    -e DB_HOST=postgres \
    -e DB_NAME=quizmaster \
    -e DB_USER=quizmaster \
    -e DB_PASS=quizmaster \
    -e DB_SCHEMA=public \
    -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}" \
    -e SPRING_DEVTOOLS_RESTART_ENABLED=false \
    --mount "type=bind,source=$container_repo_root,target=/quizmaster" \
    -w /quizmaster \
    "$ci_image" \
    -ec '
        rm -rf backend/build
        find frontend specs mcp -name "*.tsbuildinfo" -delete

        pnpm install:all
        pnpm code:ci
        pnpm test:mcp
        pnpm build:ci:fe
        pnpm test:be
        pnpm test:e2e:ci
    '
