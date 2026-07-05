# Quizmaster MCP Server Configuration

This document explains how to configure the Quizmaster MCP server for production Quizmaster and for MCP hosts that connect over stdio.

## Prerequisites

- Install repository dependencies:

```bash
pnpm install:all
```

- Ensure `https://quizmaster.scrumdojo.cz` is reachable for production use. Local test runs can target another REST API by setting `QUIZMASTER_MCP_BASE_URL`.
- Have a Quizmaster bearer token available for protected workspace, question, quiz, and stats calls.

## Runtime Configuration

The MCP server reads operational settings from environment variables. The default Quizmaster base URL targets production so normal write tools create production workspaces, questions, and quizzes. Use `QUIZMASTER_MCP_BASE_URL` only for explicit local or test runs.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `QUIZMASTER_MCP_TRANSPORT` | No | `stdio` | MCP transport. The current implementation supports only `stdio`. |
| `QUIZMASTER_MCP_BASE_URL` | No | `https://quizmaster.scrumdojo.cz` | Quizmaster REST API base URL. Set this explicitly for local or test backends, for example `http://localhost:8080`. |
| `QUIZMASTER_MCP_LOG_LEVEL` | No | `info` | Log level. Allowed values are `debug`, `info`, `warn`, and `error`. |
| `QUIZMASTER_MCP_REQUEST_TIMEOUT_MS` | No | `10000` | Positive integer timeout for Quizmaster REST calls, in milliseconds. |
| `QUIZMASTER_AUTH_MODE` | No | `bearer` | `bearer` for authenticated REST calls, `none` only for legacy local development. |
| `QUIZMASTER_AUTH_TOKEN` | Yes for protected calls in bearer mode | none | Bearer token used by the MCP server when calling protected REST endpoints. |

`QUIZMASTER_BASE_URL` is intentionally ignored by the CLI runtime. This prevents stale local MCP host configuration from accidentally redirecting MCP writes. Use the explicit `QUIZMASTER_MCP_BASE_URL` setting when a non-production backend is intended.

The stdio transport reserves stdout for MCP JSON-RPC messages. Logs and diagnostics must go to stderr.

## Local Development Scripts

Convenience scripts defined in `package.json5` at the repository root:

```bash
pnpm install:mcp     # install MCP package dependencies only
pnpm code:mcp        # tsc + lint + format
pnpm test:mcp        # vitest
pnpm mcp             # start the server (waits for an MCP host on stdin/stdout)
```

## Production Smoke Run

From the repository root, run:

```bash
pnpm --silent --dir mcp start
```

This starts the MCP server and waits for an MCP host to speak JSON-RPC over stdin/stdout. For normal use, start it from an MCP host configuration instead of typing JSON-RPC manually in a terminal.

## Generic MCP Host Configuration

Use this shape for MCP hosts that support an `mcpServers` JSON configuration:

```json
{
  "mcpServers": {
    "quizmaster": {
      "command": "pnpm",
      "args": ["--silent", "--dir", "/workspaces/quizmaster/mcp", "start"],
      "env": {
        "QUIZMASTER_MCP_TRANSPORT": "stdio",
        "QUIZMASTER_MCP_LOG_LEVEL": "info",
        "QUIZMASTER_MCP_REQUEST_TIMEOUT_MS": "10000",
        "QUIZMASTER_AUTH_MODE": "bearer",
        "QUIZMASTER_AUTH_TOKEN": "replace-with-quizmaster-token"
      }
    }
  }
}
```

Adjust `/workspaces/quizmaster/mcp` to the absolute path of the local `mcp` package when running outside this workspace.

Use `--silent` so the package manager does not write lifecycle output to stdout before the MCP server starts.

## Local Test Host Configuration

Use a separate MCP server entry for local testing so production and local targets are visible in the MCP host:

```json
{
  "mcpServers": {
    "quizmaster-local": {
      "command": "pnpm",
      "args": ["--silent", "--dir", "/workspaces/quizmaster/mcp", "start"],
      "env": {
        "QUIZMASTER_MCP_BASE_URL": "http://localhost:8080",
        "QUIZMASTER_MCP_TRANSPORT": "stdio",
        "QUIZMASTER_MCP_LOG_LEVEL": "info",
        "QUIZMASTER_MCP_REQUEST_TIMEOUT_MS": "10000",
        "QUIZMASTER_AUTH_MODE": "none"
      }
    }
  }
}
```

Use `QUIZMASTER_AUTH_MODE=none` only against a legacy unauthenticated local backend. Against a fortified local backend, use `QUIZMASTER_AUTH_MODE=bearer` and set `QUIZMASTER_AUTH_TOKEN`.

Call `quizmaster_health` after connecting to confirm the MCP server is using the intended base URL.

## Available Capabilities

After the MCP host connects, the Quizmaster server exposes:

- tools for health checks and workspace, question, quiz, and statistics operations,
- resources under the `quizmaster://` URI scheme,
- prompts for creating questions, reviewing workspaces, and creating quizzes from tags.

Useful first checks from an MCP host:

- call `quizmaster_health` to confirm that the backend is reachable,
- read `quizmaster://domain-language` to load Quizmaster terminology,
- create or provide a workspace GUID before using workspace-scoped tools.

## Authentication Notes

In the default `bearer` mode, every protected REST call includes:

```http
Authorization: Bearer ${QUIZMASTER_AUTH_TOKEN}
```

If `QUIZMASTER_AUTH_TOKEN` is missing in bearer mode, protected tools and resources fail before making a REST request. The health tool still works without a token because it calls public health endpoints.

Token values must never be written to stdout, stderr, MCP tool results, MCP resources, or error messages.

Example authenticated host configuration:

```json
{
  "mcpServers": {
    "quizmaster": {
      "command": "pnpm",
      "args": ["--silent", "--dir", "/workspaces/quizmaster/mcp", "start"],
      "env": {
        "QUIZMASTER_AUTH_MODE": "bearer",
        "QUIZMASTER_AUTH_TOKEN": "replace-with-local-token",
        "QUIZMASTER_MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| MCP host reports invalid JSON or protocol startup failure | Confirm the command uses `pnpm --silent` and that nothing writes to stdout except the MCP server. |
| `quizmaster_health` returns unreachable | Confirm the configured Quizmaster REST API base URL is reachable from the MCP host environment. |
| Startup fails with unsupported transport | Set `QUIZMASTER_MCP_TRANSPORT=stdio` or remove the variable. |
| Protected tools fail before making REST calls | Set `QUIZMASTER_AUTH_TOKEN` or use `QUIZMASTER_AUTH_MODE=none` only for a legacy local backend. |
| REST calls time out | Increase `QUIZMASTER_MCP_REQUEST_TIMEOUT_MS` or check backend/database startup. |
| Tools cannot find a workspace | Provide an existing workspace GUID or create one with `quizmaster_create_workspace`. The current REST API has no workspace index endpoint. |

## Verification Commands

Run these commands before sharing a configured MCP setup:

```bash
pnpm code:mcp:tsc
pnpm test:mcp
pnpm --silent --dir mcp start
```

The final command is expected to keep running until the MCP host disconnects or the process is stopped.
