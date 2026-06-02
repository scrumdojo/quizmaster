#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"

cd "$repo_root"

git config --local core.hooksPath .githooks

echo "Git hooks enabled from .githooks."
