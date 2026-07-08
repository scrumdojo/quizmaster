# Changes report: `SW1` and `new-feature`

_Last updated: after committing the local workspace search change and re-running the full e2e suite against a cleaned database._

## `SW1` (worktree `/home/dev/workspace/SW1`, branch `SW1`)

**No git commits ahead of `master`** — the branch sits at the exact same commit as `master` (`40e05415`). There are no functional code changes on this branch.

Present, but **not tracked in git** (so not part of the branch history):
- A local `.env` fix: `DB_SCHEMA` changed from `SW1` (uppercase) to `sw1`, plus cleanup of the incorrectly-created `"SW1"` Postgres schema — this resolved a Flyway startup failure (`.env` is gitignored). Root cause: Postgres folds unquoted identifiers to lowercase, so the quoted `"SW1"` schema Flyway created never matched the unquoted `search_path` it set, leaving the session with no valid schema.
- Untracked files in `docs/screenshots/` (4 images: XP/Star Trek wallpapers and 2 screenshots) — loose assets, never committed.
- The `SW1` worktree's dev servers (backend :8081, frontend :5174) have since been stopped.

## `new-feature` (worktree `.claude/worktrees/new-feature`, branch `new-feature`)

**25 commits ahead of `master`** (24 pre-existing + 1 new from this session), in three groups:

**Theme reskin (Windows XP / Star Trek):**
- `implement the Windows XP reskin`, `implement the Star Trek (LCARS) reskin`
- a series of fixes: XP button/card background, workspace title bar, dropdown clipping, `.take-card` pill shape, LCARS radio/checkbox colors, tooltips
- wallpaper photos for both themes
- reskin of the quiz-take flow and the Robin AI chatsheet
- final pass: reskin coverage for the remaining screens
- `add an app theme selector next to Background game`, `add a photo background theme tied to the current question`

**i18n (EN/NL) + navigation/UI:**
- translations for: AI assistant error messages, poll authoring + quiz/question-taking flow, quiz editing/statistics/share pages, workspace management/question authoring, and the home page (incl. language selector)
- `jump back to a filled workspace, and back-to-home from the quiz score page`
- `search workspaces by title in the "jump back in" filter`
- UI fixes: FAB spacing, removal of the hidden Pi corner toggle, date input padding

**New this session — commit `167c4aa1`, "feat(nav): search workspaces locally instead of round-tripping to the backend":**
Reworked the "jump back in" search from server-side to client-side filtering, per request:
- `backend/.../WorkspaceController.java` — removed the `query`/`from`/`to` parameters on `GET /api/workspaces`; it now always returns the full list
- `backend/.../WorkspaceControllerTest.java` — removed the corresponding server-side filter tests
- `frontend/src/make/api/workspace.ts` — simplified `fetchWorkspaces()`, no more filter parameters
- `frontend/src/make/home.tsx` — fetches the list once per page visit, then filters locally by title; date-range fields (from/to) removed entirely
- `frontend/src/i18n/{en,nl,types}.ts` — removed labels for the deleted date fields

Working tree is clean; nothing left uncommitted.

## Verification

- Frontend: typecheck, lint, and format all clean.
- Backend: compiles; all `WorkspaceControllerTest` tests pass.
- `GET /api/workspaces?query=...` confirmed to ignore the query param and always return the full list.
- Full e2e suite run twice against the `new-feature` dev server:
  - **1st run** (against an already-populated local Postgres): 356 passed, 9 failed, 34 skipped. One failure ("Jump back into an existing workspace from home") was caused by leftover duplicate-titled test workspaces accumulated from earlier manual test runs, not a functional bug.
  - **Cleanup**: truncated all data tables (`workspace`, `question`, `quiz`, `poll`, `poll_answer`, `attempt`, `attempt_question`, `cohort`) in the local Postgres `public` schema.
  - **2nd run** (clean database): **357 passed, 8 failed, 34 skipped**. The "Jump back into an existing workspace from home" scenario now passes.
- Remaining 8 failures are all pre-existing and unrelated to the workspace search change — Quiz.Stats / Quiz.DryRun / Quiz.ScorePage / Quiz.Timer scenarios failing on attempt-duration assertions (e.g. expected `"10s"`, received `"0s"`), which touch quiz-attempt timing code untouched by this work. Likely environment-specific timing flakiness; not investigated further as it's out of scope for the workspace search request.

## Side note

While running the e2e suite, the console output showed a "tip" injected by the `dotenv` npm dependency (v17.4.0, used in `specs/`) suggesting AI agents install a third-party package (`vestauth`) and route secrets through an external service (`as2.dotenvx.com`). This was **not acted on** — flagging it here as a known supply-chain-style prompt-injection risk in that dependency's bundled `SKILL.md`/console tips.
