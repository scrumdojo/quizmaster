#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

. "$root/scripts/dev-env.sh"

echo "Starting Quizmaster at http://localhost:$FE_PORT with backend http://localhost:$BE_PORT"
exec pnpm start
