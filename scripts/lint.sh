#!/usr/bin/env bash
# Claude Code PostToolUse hook: lint the file that was just written/edited.
#
# Reads the hook payload as JSON on stdin (Claude pipes it in) and lints the
# file at .tool_input.file_path with the right linter for its type.
#
# Exit codes:
#   0  file is clean, or not a lintable file type (nothing to do)
#   2  file failed linting (Claude Code treats exit 2 as a blocking error and
#      feeds this script's output back to the model so it can fix the file)
#
# Linters (non-mutating check mode, mirroring the `code:ci:*` scripts):
#   TS/JS under frontend/src, specs/src, specs/test, mcp/src, mcp/test
#       -> oxlint --deny-warnings  +  oxfmt --check
#   Java under backend/src
#       -> prettier --check
#   Gherkin .feature under specs/features
#       -> gherkin-fmt --check
set -uo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$root/node_modules/.bin:$PATH"

# The changed file's path comes from the hook JSON on stdin. Suppress jq's
# parse-error chatter on malformed/empty stdin — an unreadable path just means
# "nothing to lint" (exit 0), not a failure.
file="$(jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file" ] && exit 0

# Normalise to a path relative to the repo root.
case "$file" in
    /*) rel="${file#"$root"/}" ;;
    *) rel="$file" ;;
esac

# Only lint files that actually exist (edits may be followed by deletes/moves).
[ -f "$root/$rel" ] || exit 0

cd "$root" || exit 0

fail() {
    echo "❌ Lint failed for $rel — fix the issues above before continuing." >&2
    exit 2
}

case "$rel" in
    frontend/src/* | specs/src/* | specs/test/* | mcp/src/* | mcp/test/*)
        case "$rel" in
            *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
                oxlint --deny-warnings "$rel" || fail
                oxfmt --check "$rel" || fail
                ;;
        esac
        ;;
    backend/src/*.java)
        prettier --check "$rel" || fail
        ;;
    specs/features/*.feature)
        "$root/specs/node_modules/.bin/tsx" \
            "$root/specs/src/gherkin-fmt/cli.ts" --check "$root/$rel" || fail
        ;;
esac

exit 0
