#!/usr/bin/env bash
set -euo pipefail

# Bootstraps the exploratory-testing agent on a fresh machine.
#
# The agent drives a browser through the Playwright MCP (@playwright/mcp),
# spawned via npx with its OWN bundled playwright-core — a different chromium
# revision than the one specs/ uses. This is NOT covered by the repo's
# `pnpm install:all`, so run this after pulling the branch.
# See PLAYWRIGHT_SETUP.md (in this folder) for the full rationale.
#
# Self-contained: touches only this module and the shared Playwright browser
# cache (~/.cache/ms-playwright). Idempotent — re-running is safe.
#
#   cd agent && ./install.sh        (or: pnpm setup)

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

# The MCP version is pinned in agent.ts — read it from there so this script
# never drifts out of sync with what the agent actually spawns.
mcp_pin="$(grep -oE '@playwright/mcp@[0-9]+\.[0-9]+\.[0-9]+' "$here/agent.ts" | head -1)"
if [ -z "$mcp_pin" ]; then
    echo "Could not find the @playwright/mcp pin in agent.ts." >&2
    exit 1
fi

echo "==> 1/4 Installing agent package dependencies"
pnpm install
pnpm tsc

echo "==> 2/4 Warming the npx cache for $mcp_pin"
npx "$mcp_pin" --version

echo "==> 3/4 Installing the chromium revision this MCP requires"
# Use the MCP's own bundled playwright-core so the exact revision it pins lands
# in ~/.cache/ms-playwright. specs/'s chromium is a different revision and does
# not satisfy the MCP.
pwcli="$(find "$HOME/.npm/_npx" -path "*playwright-core/cli.js" 2>/dev/null | head -1)"
if [ -z "$pwcli" ]; then
    echo "Could not locate playwright-core in the npx cache. Did step 2 run?" >&2
    exit 1
fi
node "$pwcli" install chromium

echo "==> 4/4 Verifying the browser is present"
pwcore_dir="$(dirname "$pwcli")"
expected_rev="$(grep -A6 '"name": "chromium"' "$pwcore_dir/browsers.json" \
    | grep -oE '"revision": "[0-9]+"' | grep -oE '[0-9]+' | head -1)"

if [ -n "$expected_rev" ] && ls "$HOME/.cache/ms-playwright" 2>/dev/null | grep -q "chromium-$expected_rev"; then
    echo "OK: chromium-$expected_rev is installed."
else
    echo "WARNING: expected chromium-${expected_rev:-<unknown>} not found in ~/.cache/ms-playwright." >&2
    echo "Contents:" >&2
    ls "$HOME/.cache/ms-playwright" 2>/dev/null >&2 || true
    exit 1
fi

echo
echo "Agent ready. To run it:"
echo "  export ANTHROPIC_API_KEY=sk-ant-..."
echo "  # start the app first (pnpm start from the repo root), then:"
echo "  pnpm run-tour \"<mission>, e.g. Explore <area, feature, risk> to discover <information>\""
