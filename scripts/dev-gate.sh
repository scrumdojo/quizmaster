#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

. "$root/scripts/dev-env.sh"

export FEATURE_FLAG="${FEATURE_FLAG:-true}"
export PW_WORKERS="${PW_WORKERS:-1}"

pnpm code:ci
pnpm test:mcp
pnpm build:ci:fe
pnpm test:be
pnpm test:e2e:ci
