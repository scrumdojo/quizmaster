#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

. "$root/scripts/dev-env.sh"

exec "$root/scripts/reset-app-db.sh"
