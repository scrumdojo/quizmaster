#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"

cd "$repo_root"

# Safe to run automatically from the `prepare` lifecycle (pnpm install).
# In environments without git or without a work tree (Docker image build,
# some CI steps), silently skip instead of failing the install.
if ! command -v git >/dev/null 2>&1; then
    echo "git not found; skipping git hooks setup."
    exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Not a git work tree; skipping git hooks setup."
    exit 0
fi

git config --local core.hooksPath .githooks

echo "Git hooks enabled from .githooks."
