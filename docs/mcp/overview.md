# Quizmaster MCP server

The MCP server (`mcp/`) is a Node.js process that exposes Quizmaster as
Model Context Protocol tools, resources, and prompts to AI clients over
stdio.

## Boundary rule

The MCP server is a thin REST shim. It does not connect to PostgreSQL, does
not duplicate backend validation, and does not implement an MCP-only
authorization model. Whatever the REST API enforces, MCP enforces by
construction.

## Architecture

```mermaid
flowchart LR
    Host["MCP Host / AI Client"] --> Server["Quizmaster MCP Server"]
    Server --> Api["Quizmaster REST API"]
    Api --> Db[("PostgreSQL")]
```

The MCP server owns protocol concerns: MCP initialization and capability
declaration, tool/resource/prompt registration, JSON schema validation for
tool inputs, mapping REST failures into MCP errors, and formatting returned
data for assistants. The Spring Boot backend owns persistence, domain
validation, and HTTP status semantics. Quizmaster's own AI assistant
(Robin) is deliberately not exposed through MCP — an MCP client is itself
an AI and drafts questions directly.

## What's exposed

The authoritative list of tools, resources, and prompts lives in the source —
this doc only names them. See the named files for the current set:

- **Tools** — `mcp/src/tools.ts`. Names use the `quizmaster_` prefix.
  Operations cover health, workspace/question/quiz CRUD, and stats.
- **Resources** — `mcp/src/resources.ts`. URIs use the `quizmaster://`
  scheme, including `quizmaster://domain-language` (served from
  [../domain-language.md](../domain-language.md)).
- **Prompts** — `mcp/src/prompts.ts`. Guided multi-step prompts for question
  authoring and workspace review.

## Known gaps

- **Quiz question weights**: The `questionWeights` field introduced for
  weighted scoring is not yet surfaced in the MCP quiz schema (`mcp/src/schemas.ts`).
  Quizzes created or updated through MCP will have all weights default to 1.
  See `backlog/` if this needs MCP support.

## Related docs

- [configuration.md](configuration.md) — how to run and configure the server.
- [rest-auth.md](rest-auth.md) — current REST auth state (none).
- [../../backlog/mcp-spec.md](../../backlog/mcp-spec.md) — the original
  specification: goals, non-goals, full tool/resource/prompt schemas,
  validation rules, and migration notes.
