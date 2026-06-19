#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

pnpm env:init
pnpm install
pnpm install:fe

(cd specs && pnpm install)
if command -v chromium >/dev/null 2>&1; then
    echo "Using system Chromium at $(command -v chromium); skipping Playwright browser download."
else
    (cd specs && pnpm install:playwright)
fi

pnpm install:mcp
pnpm install:psql
