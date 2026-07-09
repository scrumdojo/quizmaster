# CLAUDE.md

This file provides guidance to AI coding assistants (Claude Code, GitHub Copilot) working with this repository.

## Project Overview

Quizmaster is a training application for Scrum workshops at ScrumDojo.cz. Core features:

- Create and manage questions, workspaces, and quizzes
- Take standalone questions or complete quizzes

Built incrementally using thin slices of functionality — a key learning objective of the training.

## Documentation

The repo's prose documentation lives in two places:

- **`docs/`** describes what is real in the codebase today.
    - `architecture.md`, `domain-language.md`, `ai-assistant.md` — system-level
    - `mcp/` — MCP server (overview, configuration, current REST auth state)
    - `conventions/` — code, controller, and E2E style guides
    - `team/` — definition of done, working agreement
    - `devenv/` — how to set up and run the project locally
- **`backlog/`** holds planning material: target specs, design notes, and
  pending refactors. Anything aspirational or not-yet-implemented goes here,
  not in `docs/`.

**When you change code, update related documentation in the same change.**
If you touch a domain entity, check `docs/domain-language.md`. If you touch
the AI assistant pipeline, check `docs/ai-assistant.md`. If you touch the
MCP server's tools or configuration, check `docs/mcp/`. If you change the
public REST surface or routes, check `CLAUDE.md` itself. If a doc claim no
longer matches the code, fix the doc — do not leave drift behind. If a
change makes a planned item from `backlog/` real, move the relevant content
into `docs/` and delete or trim the backlog entry.

## Architecture

**Monorepo with frontend built into backend:**

- Frontend: React 19 SPA (Vite) → builds to `backend/src/main/resources/static/`
- Backend: Spring Boot 3 serves frontend at `/` and REST APIs at `/api/*`
- Database: PostgreSQL (JPA/Hibernate + Flyway migrations in `backend/src/main/resources/db/migration/`)
- Deployment: Single JAR containing both frontend and backend

**Key insight:** Frontend is built into backend — `pnpm test:e2e` handles this automatically.

**`/shared` is the FE↔specs contract zone.** Types, parsers, and defaults that both the React app and the E2E spec layer must agree on live in `/shared/{types,parsers,defaults}/`. Both projects import via the `#shared/*` alias. Everything in `/shared` must be pure TypeScript with no framework dependencies — if something needs React or Playwright, it doesn't belong there. Type names match the backend (`QuestionRequest`, `QuizRequest`, `IdResponse`, …) so FE, specs, and BE share vocabulary. Currently hand-written; migrating to OpenAPI codegen is a viable future step.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, Gradle (Kotlin DSL), Lombok
- **Frontend:** TypeScript, React 19, Vite, oxlint (linting), oxfmt (formatting). The Epic Battle screen renders its animated battlefield with PixiJS (lazy-loaded); its CC0 sprites live in `frontend/public/epic-battle/`.
- **E2E Testing:** Cucumber + Playwright (separate `specs/` package)
- **Database:** PostgreSQL
- **MCP Server:** TypeScript package at `mcp/` exposing Quizmaster as Model Context Protocol tools/resources/prompts. See `docs/mcp/overview.md`.

## Development Commands

All commands run from the **project root**.

```bash
# First-time setup
pnpm install:all                   # All dependencies + Playwright browsers

# Code quality (run before committing)
pnpm code                          # TypeScript + oxlint + oxfmt (frontend, specs, mcp) + Prettier Java (backend)
pnpm code:be                       # Backend only: Prettier Java reformat
                                   # Error Prone runs automatically as part of `compileJava` / `pnpm test:be`

# Backend tests
pnpm test:be                       # All backend tests
pnpm test:be:local                 # Local tests only (no API key needed)

# E2E tests — builds frontend, starts backend, runs all specs, then stops backend
pnpm test:e2e

# Coverage — reports land under site/coverage/{frontend,backend}/
pnpm coverage:be                   # BE merged report (unit only, no E2E run)
pnpm coverage:e2e                  # FE + BE merged report (unit + E2E exec data)
```

**If `pnpm test:e2e` fails with "Ports 8080 and/or 5173 are in use"**, stop the running backend/frontend first. Do NOT attempt to kill the processes automatically — ask the user to stop them.

## Domain Model

Entities: **Workspace**, **Question**, **Quiz**, **Attempt**, **Poll**. See
`docs/domain-language.md` for the model. Backend entity classes live in their
respective packages (see _Backend Structure_).

## Backend Structure

Each domain has its own package under `cz.scrumdojo.quizmaster`: `question/`,
`quiz/`, `workspace/`, `attempt/`, `poll/`, `aiassistant/`, plus `common/` and
`config/`. Style: `docs/conventions/controller-style.md` and
`docs/conventions/code-style.md`.

## REST API

Endpoints live under `/api/`. Two flavors:

- **Authoring** is workspace-scoped: `/api/workspaces/{guid}/...` for
  questions, quizzes, polls, and AI drafting. Shared by FE and MCP (except
  AI drafting — `POST .../ai-assistant/chat` is used by the FE only).
  `GET /api/workspaces` lists workspaces that contain at least one question
  (guid + title, newest first by creation date), optionally narrowed by
  `from`/`to` date query params; used by the home page to link back into
  an existing workspace. Includes
  `GET /api/workspaces/{guid}/polls` for poll list,
  `GET /api/workspaces/{guid}/polls/{id}` for poll detail,
  `GET /api/workspaces/{guid}/polls/{id}/results` for poll results,
  `POST /api/workspaces/{guid}/polls` for poll creation (an optional
  `answerImages` array, parallel to `answers`, sets each answer's image URL —
  each answer needs text, an image, or both),
  `PUT /api/workspaces/{guid}/polls/{id}` for poll update (answers carrying
  their id keep collected votes and each carries its own optional `imageUrl`;
  answers without an id are added; each answer still needs text, an image, or
  both),
  `DELETE /api/workspaces/{guid}/polls/{id}` for poll deletion (votes
  included), and
  `POST /api/workspaces/{guid}/quizzes/{id}/dry-runs` for author previews.
  `GET /api/workspaces/{guid}/quizzes/{id}/live-stats` for cohort live stats on the share screen.
  `GET /api/workspaces/{guid}/quizzes/{id}/epic-battle` for per-cohort weighted
  points and hit counts driving the Epic Battle screen (quizzes with exactly
  two cohorts).
  Question and quiz listing support optional server-side filtering via
  `GET /api/workspaces/{guid}/questions?query=...&tag=...`, where `query`
  matches question text and tags and repeated `tag` parameters filter to
  questions carrying any selected workspace tag, and
  `GET /api/workspaces/{guid}/quizzes?query=...`.
  Quiz create/update (`POST`/`PUT /api/workspaces/{guid}/quizzes/{id}`) accept
  an optional `questionWeights` array (parallel to `questionIds`; each weight
  1–5, default 1) that controls per-question point contribution to the score.
- **Taking** is unscoped by quiz/question id: `/api/quiz/{id}`,
  `/api/quiz/{id}/leaderboard`,
  `/api/question/{id}`, `/api/poll/{id}`, `/api/poll/{id}/submit`, `/api/attempt/...`.
  The evaluation response (`POST /api/quiz/{quizId}/attempts/{attemptId}/evaluate`)
  includes `weightedScore` and `totalWeight` alongside `score` and
  `totalQuestions`; each per-question entry also carries `missedBefore` — true
  when the same taker (`nickname` + `cohortGuid`) got that question wrong on an
  earlier finished attempt of the same quiz.
  `POST /api/question/{id}/explanation-chat` drives the taker-facing follow-up
  chat under a question's explanation (stateless, frontend-owned transcript,
  same shape as Robin's chat endpoint) — see `docs/ai-assistant.md`.
  `GET /api/quiz/{quizId}/mistakes-history?nickname=...&cohortGuid=...` returns
  every question that taker has ever gotten wrong (or partially wrong) across
  all of their finished attempts at that quiz — the data backing the taker's
  persistent mistakes-history page.
- Plus `GET /api/feature-flag`.

Controllers are the source of truth: workspace authoring lives in
`workspace/` (`WorkspaceController`, `WorkspaceQuestionController`,
`WorkspaceQuizController`), with poll authoring in `poll/`
(`PollController`); taking lives in `*TakeController` +
`AttemptController`; AI drafting in `AiAssistantController`; the taker-facing
explanation chat in `ExplanationChatController` (`question/`), backed by
`ExplanationChatService` (`aiassistant/`). See `docs/mcp/rest-auth.md` for the
(absent) auth state.

## Frontend Routes

The router lives in `frontend/src/`. Path families:

- `/` — home.
- `/workspace/...` — maker views (workspace, question, quiz CRUD, poll CRUD and results, stats).
  Includes `/workspace/:workspaceId/quiz/:id/epic-battle`, the full-page animated
  battle view linked from a two-cohort quiz's Share screen.
- `/quiz/:id`, `/quiz/:id/questions/:questionId?` — taker views for quizzes.
  `/quiz/:id/history?nickname=...&cohortGuid=...` is the taker's persistent
  mistakes-history page, linked from the score page; identity lives in the
  query string so the page is bookmarkable/refresh-safe.
- `/question/:id` — taker view for a standalone question.
- `/poll/:id` — taker view for a standalone poll.

## E2E Testing

BDD specs in `specs/features/`, organized into `make/` (creating) and `take/` (answering).

**Style guide:** See `docs/conventions/e2e-style-guide.md` and `docs/conventions/code-style.md`.

**Test layers:**

- **Page Objects** (`specs/src/pages/`) — DOM abstraction, queries and actions
- **Ops** (`specs/src/steps/<feature>/ops.ts`) — multi-step workflows
- **Expects** (`specs/src/steps/<feature>/expects.ts`) — domain assertions
- **Steps** (`specs/src/steps/<feature>/*.ts`) — thin Gherkin-to-code glue

## Development Practices

- **Trunk-Based Development** — all work on `master`, frequent pull/rebase/push
- **Test-First** — write Gherkin spec before code
- **Thin Slices** — one scenario at a time, code only what's needed to pass it
- **Mob/Pair Programming** — shared ownership

## AI Assistant

Quizmaster generates question drafts via **Robin AI** (frontend FAB + chat sheet), a multi-turn conversation over `POST /api/workspaces/{guid}/ai-assistant/chat`. The frontend owns the transcript and sends it whole on every call; the backend (`AiAssistantController` → `AiAssistantService.chat`) replays it to OpenRouter under one unified system prompt (`prompts/robin-chat.md`) that infers each question's type from natural language. Generated questions that duplicate existing workspace questions (exact text match, or cosine similarity on cached embeddings above `ai.embedding.similarity-threshold`) are filtered out of the drafts and reported via a `notice` field — HTTP 200, no retry; the maker's next chat message is the retry.

Architecture, contracts (`RobinFormBinding`), file layout, and OpenRouter configuration: see `docs/ai-assistant.md`. Setup: see `docs/devenv/how-to-develop.md`.

## MCP Server

The `mcp/` package exposes Quizmaster as a Model Context Protocol server (stdio transport) so AI clients can read and manage workspaces, questions, quizzes, and stats through the existing REST API. It deliberately exposes no AI drafting tool — an MCP client is itself an AI and drafts questions directly.

- **Boundary:** the MCP server is a thin REST shim. It never reads the database directly and never duplicates backend validation. The backend currently has no authentication layer; MCP is wired to send a bearer token but the backend does not validate it yet. See `docs/mcp/rest-auth.md` for the current state.
- **Docs:** `docs/mcp/overview.md` (what it is), `docs/mcp/configuration.md` (how to run it), `docs/mcp/rest-auth.md` (current REST auth state).
- **Workspace-scoped REST routes** (`/api/workspaces/{guid}/...`) are shared between MCP and the FE.
