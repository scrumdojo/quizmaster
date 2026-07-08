# Quizmaster Architecture

Quizmaster follows a traditional client-server architecture.

## Frontend

Frontend is a Single-Page Application (SPA) in [React 19](https://react.dev/). It uses [react-router](https://reactrouter.com/) for routing.

The Epic Battle screen (`/workspace/:workspaceId/quiz/:id/epic-battle`) renders an animated cohort battlefield with [PixiJS](https://pixijs.com/), lazy-loaded so it stays out of the main bundle. Its scene (`make/quiz/epic-battle/battle-scene.ts`) is purely decorative — all test-visible DOM (army cards, waving standards) lives in React — and degrades to a static gradient if WebGL/assets are unavailable. Sprites are CC0 and committed under `frontend/public/epic-battle/`.

## Backend

Backend is a Spring Boot application, serving both frontend as a SPA (Single-Page Application) at URL `\`, and REST APIs for the frontend at URLs starting with `\api\`.

- Uses [Lombok](https://projectlombok.org/) to reduce boilerplate code.

Data are stored in a PostgreSQL database.

- DB is accessed using JPA/Hibernate,
- data scheme versioned and migrated using Flyway.

## Component Diagram

```mermaid
flowchart TB
    spa["Frontend SPA"]
    mcp["MCP Server (stdio)"]
    ai["MCP Host / AI client"]

    subgraph server["Spring Boot"]
        fe["Frontend assets"]
        api["REST API"]
        jpa["JPA/Hibernate"]
        mig["Flyway"]
        api --- jpa
        api --- mig
    end

    db[("PostgreSQL")]
    or["OpenRouter
    (chat + embeddings)"]

    spa --> api
    ai --> mcp
    mcp --> api
    api --> or
    jpa --> db
    server -.serves.- spa
```

## AI Assistant

Question generation calls **OpenRouter** through two endpoints sharing one API
token: chat completions for drafting and embeddings for duplicate avoidance.
The component diagram above shows OpenRouter as a single external dependency
of the REST API.

For the architecture, contracts between frontend and backend, the
embedding-based duplicate-avoidance flow, and configuration, see
[ai-assistant.md](ai-assistant.md).

## MCP Server

The MCP server (`mcp/` package) is a separate Node.js process that exposes
Quizmaster as Model Context Protocol tools, resources, and prompts over stdio.

**Boundary rule:** the MCP server is a thin REST shim. It does not connect to
PostgreSQL, does not duplicate backend validation, and does not implement an
MCP-only authorization model. Whatever the REST API enforces, MCP enforces by
construction.

Authoring goes through workspace-scoped REST routes (`/api/workspaces/{guid}/...`).
FE and MCP share these controllers.

Specs: [mcp/overview.md](mcp/overview.md), [mcp/configuration.md](mcp/configuration.md),
[mcp/rest-auth.md](mcp/rest-auth.md).
