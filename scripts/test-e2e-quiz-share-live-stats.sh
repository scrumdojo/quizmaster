#!/usr/bin/env bash
# E2E: Quiz.Share.LiveStats — all active scenarios in the feature file.
#
# Uses the generated Playwright spec path (not -g) so filtering works through pnpm.
#
# Usage (from repo root):
#   ./scripts/test-e2e-quiz-share-live-stats.sh
#   pnpm test:e2e:quiz-share-live-stats
#
# With servers already running (pnpm start):
#   ./scripts/test-e2e.sh --dev .features-gen/features/make/quiz/Quiz.Share.LiveStats.feature.spec.js
set -euo pipefail

FEATURE=".features-gen/features/make/quiz/Quiz.Share.LiveStats.feature.spec.js"

exec "$(dirname "$0")/test-e2e.sh" "$FEATURE" "$@"
