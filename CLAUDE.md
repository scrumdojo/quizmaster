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
- **Frontend:** TypeScript, React 19, Vite, oxlint (linting), oxfmt (formatting)
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
  questions, quizzes, polls, and AI drafting. Shared by FE and MCP. Includes
  `GET /api/workspaces/{guid}/polls/{id}` for poll detail and
  `POST /api/workspaces/{guid}/quizzes/{id}/dry-runs` for author previews.
- **Taking** is unscoped by quiz/question id: `/api/quiz/{id}`,
  `/api/quiz/{id}/leaderboard`,
  `/api/question/{id}`, `/api/attempt/...`.
- Plus `GET /api/feature-flag`.

Controllers are the source of truth: workspace authoring lives in
`workspace/` (`WorkspaceController`, `WorkspaceQuestionController`,
`WorkspaceQuizController`), with poll authoring in `poll/`
(`PollController`); taking lives in `*TakeController` +
`AttemptController`; AI drafting in `AiAssistantController`. See
`docs/mcp/rest-auth.md` for the (absent) auth state.

## Frontend Routes

The router lives in `frontend/src/`. Path families:

- `/` — home.
- `/workspace/...` — maker views (workspace, question, quiz CRUD, stats).
- `/quiz/:id`, `/quiz/:id/questions/:questionId?` — taker views for quizzes.
- `/question/:id` — taker view for a standalone question.

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

Quizmaster generates question drafts via **Robin AI** (frontend FAB + sheet) calling an `AiAssistantController` that proxies to OpenRouter. Drafts are deduplicated against existing questions in the workspace via cosine similarity on cached embeddings; a match above `ai.embedding.similarity-threshold` triggers one retry with feedback, then fails with `502`.

Architecture, contracts (`RobinFormBinding`), file layout, and OpenRouter configuration: see `docs/ai-assistant.md`. Setup: see `docs/devenv/how-to-develop.md`.

## MCP Server

The `mcp/` package exposes Quizmaster as a Model Context Protocol server (stdio transport) so AI clients can read and manage workspaces, questions, quizzes, stats, and AI drafts through the existing REST API.

- **Boundary:** the MCP server is a thin REST shim. It never reads the database directly and never duplicates backend validation. The backend currently has no authentication layer; MCP is wired to send a bearer token but the backend does not validate it yet. See `docs/mcp/rest-auth.md` for the current state.
- **Docs:** `docs/mcp/overview.md` (what it is), `docs/mcp/configuration.md` (how to run it), `docs/mcp/rest-auth.md` (current REST auth state).
- **Workspace-scoped REST routes** (`/api/workspaces/{guid}/...`) are shared between MCP and the FE.
